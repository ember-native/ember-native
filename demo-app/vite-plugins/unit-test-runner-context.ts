import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

export const UNIT_TEST_RUNNER_CONTEXT_VIRTUAL_ID = 'virtual:ns-unit-test-runner-context';

/**
 * The unit test runner package (`@nativescript/unit-test-runner`) ships its
 * own XML/CSS/JS view files (`bundle-app-root`, `main-view-model`,
 * `run-details`, ...) that need to be registered into NativeScript's core
 * module registry so it can resolve them by name at runtime. This plugin
 * walks that package's `app/` directory and registers those files, the same
 * way `@nativescript/vite` registers the consuming app's own `app/` files.
 *
 * Must run before the test runner package itself is imported - injected
 * into Vite's own polyfills entry so it always runs ahead of `boot-test.js`'s
 * import of `./app/test.js`.
 */
export function unitTestRunnerContextPlugin(): Plugin {
  const RESOLVED_ID = '\0' + UNIT_TEST_RUNNER_CONTEXT_VIRTUAL_ID;
  const packageRoot = path.dirname(require.resolve('@nativescript/unit-test-runner/package.json'));
  const appDir = path.join(packageRoot, 'app');
  // The CLI regenerates this file as plain CommonJS before every test run,
  // and Rollup's commonjs plugin doesn't pick it up here (it's outside
  // `node_modules`), so `transform` below rewrites it to a real ESM export.
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

      // `main.js` is the package's own entry, imported directly elsewhere -
      // it doesn't need to be in the moduleName registry.
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
