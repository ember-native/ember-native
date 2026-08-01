import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vite';
import { typescriptConfig } from '@nativescript/vite';
import configureNativeScriptVite from 'ember-native/utils/nativescript-vite.config.js';
import { unitTestRunnerContextPlugin } from './vite-plugins/unit-test-runner-context';

const require = createRequire(import.meta.url);
// `generator-function`'s package.json `exports` map blocks a direct
// `require.resolve('generator-function/legacy.js')`; resolve the package
// root instead and address the sibling file as a plain filesystem path.
const generatorFunctionLegacyPath = path.join(path.dirname(require.resolve('generator-function/package.json')), 'legacy.js');

const emptyModulePath = require.resolve('./vite-plugins/empty-module.js');
// A handful of test-only dependencies reference Node built-ins that don't
// exist on NativeScript. Point the ones with real browser polyfills
// available at those polyfills; stub the rest to an empty module.
const nodeBuiltinAliases = [
  { find: /^stream$/, replacement: require.resolve('stream-browserify') },
  { find: /^http$/, replacement: require.resolve('stream-http') },
  { find: /^https$/, replacement: require.resolve('https-browserify') },
  { find: /^url$/, replacement: require.resolve('url') },
  { find: /^querystring$/, replacement: require.resolve('querystring-es3') },
  { find: /^buffer$/, replacement: require.resolve('buffer') },
  { find: /^(path|tty|timers|os|crypto|fs|tls|net|zlib|child_process)$/, replacement: emptyModulePath },
];

// Vite-only bundler config for `nativescript test android`, selected via
// nativescript.test.vite.config.ts's `bundlerConfigPath`. No `hmr` passed -
// it's a one-shot build, not a dev server.
export default defineConfig(({ mode }) =>
  configureNativeScriptVite({
    mode,
    mergeConfig,
    typescriptConfig,
    entry: require.resolve('./boot-test.js'),
    plugins: [unitTestRunnerContextPlugin()],
    extend: {
      resolve: {
        alias: [
          // Forces `generator-function` to resolve to its plain-CJS build,
          // which Rollup's commonjs plugin can convert correctly.
          { find: /^generator-function$/, replacement: generatorFunctionLegacyPath },
          ...nodeBuiltinAliases,
        ],
      },
      define: {
        // Read by the test runner to decide whether to exit after the run
        // (CI) or stay open for interactive debugging (local).
        __TEST_RUNNER_STAY_OPEN__: JSON.stringify(!process.env.CI),
        'process.browser': 'true',
      },
      build: {
        // Vite's dynamic-import "module preload" helper assumes a browser
        // DOM; disable it for NativeScript builds.
        modulePreload: false,
        rollupOptions: {
          // Optional native addons for a test dependency that aren't
          // installed on purpose; leave them as external so the build
          // doesn't fail resolving them.
          external: ['bufferutil', 'utf-8-validate'],
        },
      },
    },
  }),
);
