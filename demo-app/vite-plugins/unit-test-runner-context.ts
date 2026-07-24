import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

export const UNIT_TEST_RUNNER_CONTEXT_VIRTUAL_ID = 'virtual:ns-unit-test-runner-context';

/**
 * `@nativescript/unit-test-runner`'s own `app/main.js` normally
 * self-registers its XML/CSS/JS files (`bundle-app-root`, `bundle-main-page`,
 * `main-view-model`, `run-details`, `test-run-page`, ...) into NativeScript's
 * core module registry via a webpack-only
 * `require.context("./", true, /.*\.(js|css|xml)/)` call, so that
 * `Application.run({ moduleName: "bundle-app-root" })` and the page
 * navigations inside that view model (`navigateTo('run-details')` etc.) can
 * resolve those module names at runtime. `require.context` doesn't exist
 * under Vite (see the demo-app-side pnpm patch on that package, which
 * guards/skips the call there) - this plugin is the Vite-side replacement:
 * it walks that package's own `app/` directory the same way and registers
 * the same files via `global.registerBundlerModules`, the same core API
 * `@nativescript/vite`'s own `virtual:ns-bundler-context`
 * (`@nativescript/vite/configuration/typescript.js`) uses for the consuming
 * app's *own* `appRoot` - that one only ever walks `app/`, not arbitrary
 * node_modules packages, which is why this package needs its own.
 *
 * Must run before `@nativescript/unit-test-runner` itself is imported.
 * `demo-app/app/test.js` is shared with the webpack test path (resolved
 * directly by that package's own entrypoint-detection convention), so it
 * can't statically import a Vite-only `virtual:...` specifier - instead,
 * this plugin injects the import into `@nativescript/vite`'s own
 * `virtual:entry-with-polyfills` (the same virtual module its
 * `configuration/typescript.js` injects `virtual:ns-bundler-context` into),
 * which always runs before `boot.js`'s own (dynamic, test-only) import of
 * `./test.js`.
 */
export function unitTestRunnerContextPlugin(): Plugin {
  const RESOLVED_ID = '\0' + UNIT_TEST_RUNNER_CONTEXT_VIRTUAL_ID;
  const packageRoot = path.dirname(require.resolve('@nativescript/unit-test-runner/package.json'));
  const appDir = path.join(packageRoot, 'app');

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

      // Excludes `app.js`/`bundle-app.js`/`main.js` - this package's own
      // alternate top-level entry scripts, each of which calls
      // `Application.run(...)` at module *top level* (side effect on
      // import, not just on invocation). Safe under webpack's
      // `require.context` (a lazy registry - matched files are only
      // `require()`d, and thus only actually executed, the moment
      // something looks their moduleName up) but not under a real static
      // ESM `import`, which always eagerly evaluates the instant
      // vendor.mjs itself loads. None of the three are ever looked up by
      // moduleName in this app's test flow (only
      // `bundle-app-root`/`bundle-main-page` and friends are, via
      // `@nativescript/unit-test-runner`'s exported `runTestApp`, itself
      // reached through a normal - not moduleName-registry - `import`), so
      // excluding them is safe, not a functional gap. (`main-view-model.js`
      // had the same eager-import problem via its own top-level singleton -
      // fixed at the source instead, by making the singleton lazy, in the
      // pnpm patch on this package - see patches/@nativescript__unit-test-runner@4.0.1.patch.)
      const files = walk(appDir, [])
        .filter((f) => /\.(js|css|xml)$/.test(f))
        .filter((f) => !/\/(app|bundle-app|main)\.js$/.test(f.split(path.sep).join('/')));

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
