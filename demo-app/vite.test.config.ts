import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vite';
import { typescriptConfig } from '@nativescript/vite';
// eslint-disable-next-line import/no-unresolved
import configureEmberNativeVite from 'ember-native/utils/vite.config.js';
import { unitTestRunnerContextPlugin } from './vite-plugins/unit-test-runner-context';

const require = createRequire(import.meta.url);
// `generator-function`'s package.json `exports` map only allows importing
// `.` and `./package.json` as subpaths - `require.resolve('generator-function/legacy.js')`
// is rejected outright by Node's own exports enforcement before Vite/Rollup
// ever sees it. Resolve the package root via the one subpath that *is*
// allowed, then address the sibling file as a plain filesystem path, which
// exports restrictions don't apply to.
const generatorFunctionLegacyPath = path.join(path.dirname(require.resolve('generator-function/package.json')), 'legacy.js');

const emptyModulePath = require.resolve('./vite-plugins/empty-module.js');
// Mirrors webpack.config.js's `resolve.fallback` list - socket.io-client's
// dependency chain (`ws`, `xmlhttprequest-ssl`, `debug`) references these
// Node built-ins (mostly feature-detection / never-taken branches on
// NativeScript). @nativescript/vite's default handling for bare Node
// built-in specifiers is to leave the bare `import 'fs'` etc. unresolved in
// the output ("externalized for browser compatibility", by design for a
// real browser target that would just never execute that branch) - but
// NativeScript's JS environment has no such module *at all*, so an eager,
// top-level `import` of one of these (unlike a browser's lazy `require`)
// throws immediately, taking down the entire vendor.mjs module evaluation
// with an opaque "Module evaluation promise rejected" (observed on-device,
// no further detail). Point the ones webpack had real polyfills for at the
// same polyfills; stub the rest (webpack's `false` fallback entries) to a
// real empty module, since Vite has no `false`-shorthand equivalent.
const nodeBuiltinAliases = [
  { find: /^stream$/, replacement: require.resolve('stream-browserify') },
  { find: /^http$/, replacement: require.resolve('stream-http') },
  { find: /^https$/, replacement: require.resolve('https-browserify') },
  { find: /^url$/, replacement: require.resolve('url') },
  { find: /^querystring$/, replacement: require.resolve('querystring-es3') },
  { find: /^buffer$/, replacement: require.resolve('buffer') },
  { find: /^(path|tty|timers|os|crypto|fs|tls|net|zlib|child_process)$/, replacement: emptyModulePath },
];

// Vite-only bundler config for `nativescript test android` (selected via
// nativescript.test.vite.config.ts's `bundlerConfigPath`). Mirrors
// vite.config.ts (see that file's own comments for the alias-ordering
// rationale) but without ember-vite-hmr's plugin - it's dev-server/HMR only
// and irrelevant to a one-shot test build - and with the additions test.js
// needs: see VITE_MIGRATION_NOTES.md for the full writeup of why plain
// `nativescript.config.ts` + `vite.config.ts` can't just be reused as-is
// for testing.
export default defineConfig(({ mode }) => {
  const emberNativeConfig = configureEmberNativeVite();
  const merged = mergeConfig(emberNativeConfig, typescriptConfig({ mode }));
  const aliases = merged.resolve!.alias as { find: string | RegExp; replacement: string }[];
  const emberNativeReplacements = new Set(
    (emberNativeConfig.resolve!.alias as { replacement: string }[]).map((a) => a.replacement),
  );
  const [ours, rest] = [
    aliases.filter((a) => emberNativeReplacements.has(a.replacement)),
    aliases.filter((a) => !emberNativeReplacements.has(a.replacement)),
  ];
  merged.resolve!.alias = [...ours, ...rest];

  return mergeConfig(merged, {
    resolve: {
      preserveSymlinks: false,
      alias: [
        // `is-generator-function` (pulled in transitively by the `util`
        // Node-polyfill package, which socket.io-client's dependency chain
        // needs) resolves through `generator-function`'s dual-package
        // `exports` map to an `index.mjs` that does
        // `import getGeneratorFunction from './index.js'` expecting Node's
        // CJS/ESM interop to synthesize a `default` export - Rollup's
        // static analysis doesn't, and fails the build outright ("default"
        // is not exported by index.js). Force resolution to the package's
        // own plain-CJS `legacy.js` (its `main` field target) instead,
        // which Rollup's commonjs plugin converts correctly.
        { find: /^generator-function$/, replacement: generatorFunctionLegacyPath },
        ...nodeBuiltinAliases,
      ],
    },
    plugins: [unitTestRunnerContextPlugin()],
    define: {
      // Read by demo-app/app/boot.js to swap its entry over to ./test.js.
      // This config is only ever used for `nativescript test android`, so
      // it's unconditionally true here rather than sourced from the CLI's
      // `--env.unitTesting` flag (unlike webpack, which reuses the same
      // config for both build and test and needs that flag to tell them
      // apart - see nativescript.test.vite.config.ts for why Vite needs its
      // own dedicated config instead).
      __NS_UNIT_TESTING__: 'true',
      // Mirrors webpack.config.js's DefinePlugin `__TEST_RUNNER_STAY_OPEN__`
      // - @nativescript/unit-test-runner's TestBrokerViewModel.complete()
      // reads this to decide whether to kill the process after the run
      // (CI) or leave the app open for interactive debugging (local).
      __TEST_RUNNER_STAY_OPEN__: JSON.stringify(!process.env.CI),
      // Mirrors webpack.config.js's DefinePlugin `process: { browser: true }`
      // - socket.io-client's transport selection reads this.
      'process.browser': 'true',
    },
    build: {
      rollupOptions: {
        // `ws` (a socket.io-client transitive dependency) optionally
        // requires these native addons for perf, wrapped in try/catch so it
        // falls back to a pure-JS implementation at runtime when they're
        // not installed (they aren't here, deliberately - NativeScript has
        // no native Node addon support anyway). @rollup/plugin-commonjs
        // resolves `require(...)` calls statically at build time though, so
        // without this it hard-fails the whole build on the missing
        // package instead of leaving it as a runtime `require` for that
        // try/catch to catch.
        external: ['bufferutil', 'utf-8-validate'],
      },
    },
  });
});
