import { NativeScriptConfig } from '@nativescript/core';

// @nativescript/unit-test-runner only wires up its test entrypoint
// (test.ts/test.js) and karma integration through @nativescript/webpack's
// `nativescript.webpack.js` hook convention (see its nativescript.webpack.js
// and nativescript.webpack.compat.js) - @nativescript/vite has no equivalent
// hook, so `nativescript test android` still needs to build with webpack
// even though `build`/`debug android` now use vite. See
// VITE_MIGRATION_NOTES.md for the full writeup.
//
// Selected via `--config nativescript.test.config.ts` (see package.json's
// `test`/`debug-test` scripts and .github/workflows/app-test.yml). Keep the
// fields below other than `bundler`/`bundlerConfigPath` in sync with
// nativescript.config.ts.
export default {
  id: 'org.nativescript.embernativedemo',
  appPath: 'app',
  main: 'app/boot.js',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  },
  cli: {
    packageManager: 'pnpm',
  },
  bundler: 'webpack',
  bundlerConfigPath: 'webpack.config.js',
} as NativeScriptConfig;
