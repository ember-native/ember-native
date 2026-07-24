import { NativeScriptConfig } from '@nativescript/core';

// Vite-only counterpart to nativescript.test.config.ts (which still uses
// webpack - see that file's own docstring and VITE_MIGRATION_NOTES.md for
// why @nativescript/unit-test-runner needs bespoke wiring either way).
// `@nativescript/vite` always builds whatever package.json's `main` field
// points to (app/boot.js) regardless of which nativescript.*.config.ts
// selected it, so the entry swap to app/test.js happens inside boot.js
// itself, gated on a Vite `define` set only by vite.test.config.ts.
//
// Selected via `--config nativescript.test.vite.config.ts` (see
// package.json's `test:vite`/`debug-test:vite` scripts). Keep the fields
// below other than `bundler`/`bundlerConfigPath` in sync with
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
  bundler: 'vite',
  bundlerConfigPath: 'vite.test.config.ts',
} as NativeScriptConfig;
