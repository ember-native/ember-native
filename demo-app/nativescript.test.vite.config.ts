import { NativeScriptConfig } from '@nativescript/core';

// Test-only NativeScript config, selected via
// `--config nativescript.test.vite.config.ts --no-watch` (see package.json's
// `test`/`debug-test` scripts). `@nativescript/vite` always builds
// package.json's `main` (app/boot.js); the entry is swapped to test content
// via boot.js's `ember-native-app-entry` alias, which `vite.test.config.ts`
// points at `../boot-test.js`. Keep the fields below other than
// `bundler`/`bundlerConfigPath` in sync with `nativescript.config.ts`.
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
  bundler: 'vite',
  bundlerConfigPath: 'vite.test.config.ts',
} as NativeScriptConfig;
