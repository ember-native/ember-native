import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

export const UNIT_TEST_RUNNER_CONTEXT_VIRTUAL_ID = 'virtual:ns-unit-test-runner-context';

/**
 * `@nativescript/unit-test-runner` (our own local `unit-test-runner/`
 * workspace package, published standalone as `ember-native-unit-test-runner`
 * but aliased back to this exact name in `demo-app/package.json` - the
 * `nativescript` CLI's `TestExecutionService` hardcodes
 * `node_modules/@nativescript/unit-test-runner/config.js` as the path it
 * writes fresh karma connection info to before every real
 * `nativescript test android` run (`constants.js`'s `TEST_RUNNER_NAME`), so
 * consuming apps must always depend on it under this literal name regardless
 * of its published package name - a Vite/bundle-mode port of the upstream
 * `@nativescript/unit-test-runner`, see VITE_MIGRATION_NOTES.md's "Our own
 * unit test runner" section) needs its XML/CSS/JS files (`bundle-app-root`,
 * `bundle-main-page`, `main-view-model`, `run-details`, `test-run-page`,
 * ...) registered into NativeScript's core module registry so that
 * `Application.run({ moduleName: "bundle-app-root" })` and the page
 * navigations inside that view model (`navigateTo('run-details')` etc.) can
 * resolve those module names at runtime. Upstream did this itself via a
 * webpack-only `require.context(...)` call inside its own `app/main.js`;
 * this project's `unit-test-runner` package has no such call at all (it's
 * Vite-only) - this plugin is what performs the registration instead: it
 * walks that package's own `app/` directory and registers the same files
 * via `global.registerBundlerModules`, the same core API
 * `@nativescript/vite`'s own `virtual:ns-bundler-context`
 * (`@nativescript/vite/configuration/typescript.js`) uses for the consuming
 * app's *own* `appRoot` - that one only ever walks `app/`, not arbitrary
 * node_modules packages, which is why this package needs its own.
 *
 * Must run before `@nativescript/unit-test-runner` itself is imported.
 * `demo-app/app/test.js` can't statically import a Vite-only
 * `virtual:...` specifier directly (kept bundler-agnostic on principle) -
 * instead, this plugin injects the import into `@nativescript/vite`'s own
 * `virtual:entry-with-polyfills` (the same virtual module its
 * `configuration/typescript.js` injects `virtual:ns-bundler-context` into),
 * which always runs before `boot-test.js`'s own static import of
 * `./app/test.js`.
 */
export function unitTestRunnerContextPlugin(): Plugin {
  const RESOLVED_ID = '\0' + UNIT_TEST_RUNNER_CONTEXT_VIRTUAL_ID;
  const packageRoot = path.dirname(require.resolve('@nativescript/unit-test-runner/package.json'));
  const appDir = path.join(packageRoot, 'app');
  // The `nativescript` CLI's own `TestExecutionService.generateConfig`
  // overwrites this exact file with fresh karma connection info
  // (port/ips/id) right before every real `nativescript test android` run,
  // hardcoded to plain CommonJS (`module.exports = {...}`) - see
  // `unit-test-runner/app/main-view-model.js`'s docstring. `@rollup/plugin-
  // commonjs` (registered by `@nativescript/vite` itself) only transforms
  // ids matching `/node_modules/` (`configuration/base.js`'s `commonjs({
  // include: [/node_modules/] })`), but `vite.test.config.ts` sets
  // `resolve.preserveSymlinks: false`, so this workspace package's config.js
  // resolves to its real filesystem path *outside* any `node_modules`
  // directory - the commonjs plugin skips it entirely, and the raw
  // `module.exports = ` assignment ends up inlined verbatim into the ESM
  // output. `module` isn't a real global under NativeScript, so evaluating
  // that line throws `ReferenceError: module is not defined`, which
  // surfaces natively as a generic, reason-less `Module evaluation promise
  // rejected` on the whole bundle (confirmed via temporary
  // checkpoint-logging instrumentation of the built chunk, since the native
  // side swallows the actual JS error). A plain text substitution to real
  // ESM syntax - the same technique `ember-native/utils/vite-dependency-
  // patches.js` uses for actual npm dependencies - fixes this without
  // touching the CLI-generated file's on-disk CommonJS shape (which the CLI
  // would just regenerate anyway).
  const configPath = path.join(packageRoot, 'config.js');

  return {
    name: 'ns-unit-test-runner-context',
    enforce: 'pre',
    resolveId(id) {
      if (id === UNIT_TEST_RUNNER_CONTEXT_VIRTUAL_ID) {
        return RESOLVED_ID;
      }
      return null;
    },
    transform(code, id) {
      if (id === configPath) {
        if (!/^module\.exports\s*=\s*/.test(code)) {
          return null;
        }
        return { code: code.replace(/^module\.exports\s*=\s*/, 'export default '), map: null };
      }
      if (!id.endsWith('virtual:entry-with-polyfills')) {
        return null;
      }
      const marker = "import '@nativescript/core/bundle-entry-points';";
      if (!code.includes(marker)) {
        return null;
      }
      return {
        code: code.replace(marker, `${marker}\nimport ${JSON.stringify(UNIT_TEST_RUNNER_CONTEXT_VIRTUAL_ID)};`),
        map: null,
      };
    },
    load(id) {
      if (id !== RESOLVED_ID) {
        return null;
      }

      function walk(dir: string, out: string[]): string[] {
        for (const entry of readdirSync(dir)) {
          const full = path.join(dir, entry);
          if (statSync(full).isDirectory()) {
            walk(full, out);
          } else {
            out.push(full);
          }
        }
        return out;
      }

      // Excludes `main.js` - this package's own top-level entry, never
      // looked up by moduleName in this app's test flow (only
      // `bundle-app-root`/`bundle-main-page` and friends are, via
      // `@nativescript/unit-test-runner`'s exported `runTestApp`, itself
      // reached through a normal - not moduleName-registry - `import`), so
      // excluding it is safe, not a functional gap. (`main-view-model.js`'s
      // own top-level singleton has the analogous eager-import problem for
      // a *registered* module - a real static ESM `import` always eagerly
      // evaluates a module's top level the instant vendor.mjs itself loads,
      // unlike webpack's `require.context`, which only executes a matched
      // file the moment something looks its moduleName up - fixed at the
      // source instead, by making that singleton lazy: see
      // `unit-test-runner/app/main-view-model.js`'s `getMainViewModel`.)
      const files = walk(appDir, [])
        .filter((f) => /\.(js|css|xml)$/.test(f))
        .filter((f) => !/\/main\.js$/.test(f.split(path.sep).join('/')));

      const importLines: string[] = [];
      const registryEntries: string[] = [];
      const moduleMapLines: string[] = [];
      let index = 0;
      for (const abs of files) {
        const posixAbs = abs.split(path.sep).join('/');
        const relKey = './' + path.relative(appDir, abs).split(path.sep).join('/');
        const varName = `__nsutr${index++}`;
        // Raw text for XML/CSS, namespace import for JS - matches
        // @nativescript/vite's own `createBundlerContextPlugin` (same `?raw`
        // convention for both file types).
        const raw = /\.(css|xml)$/.test(abs);
        const spec = JSON.stringify(posixAbs + (raw ? '?raw' : ''));
        importLines.push(raw ? `import ${varName} from ${spec};` : `import * as ${varName} from ${spec};`);
        moduleMapLines.push(`all[${JSON.stringify(relKey)}] = ${varName};`);
        registryEntries.push(`registry.set(${JSON.stringify(relKey)}, ${JSON.stringify(relKey)});`);
      }

      const code = `// Generated: registers @nativescript/unit-test-runner's own app/ files
// into NativeScript's core module registry (see unit-test-runner-context.ts).
${importLines.join('\n')}
(function () {
  const registry = new Map();
  const all = {};
  ${moduleMapLines.join('\n  ')}
  ${registryEntries.join('\n  ')}
  function context(key) {
    const real = registry.get(key);
    if (!real) {
      throw new Error('[ns-unit-test-runner-context] module not found in context: ' + key);
    }
    return all[real];
  }
  context.keys = function () {
    return Array.from(registry.keys());
  };
  if (typeof global.registerBundlerModules === 'function') {
    global.registerBundlerModules(context);
  }
})();
`;
      return { code, map: null };
    },
  };
}
