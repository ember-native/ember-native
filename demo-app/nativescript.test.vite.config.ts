import { NativeScriptConfig } from '@nativescript/core';

// The only test config now that webpack has been fully removed (see
// VITE_MIGRATION_NOTES.md's "Follow-up session: root-caused and fixed the
// click() bug ... webpack removed" section for why @nativescript/vite needs
// bespoke wiring for `nativescript test android`, and the migration
// history). `@nativescript/vite` always builds whatever package.json's
// `main` field points to (app/boot.js) regardless of which
// nativescript.*.config.ts selected it - the entry swap to the test-only
// content is done via boot.js's `demo-app-entry` alias, which
// vite.test.config.ts points at ../boot-test.js (see both files' own
// docstrings).
//
// Selected via `--config nativescript.test.vite.config.ts --no-watch` (see
// package.json's `test`/`debug-test` scripts). Keep the fields below other
// than `bundler`/`bundlerConfigPath` in sync with nativescript.config.ts.
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
