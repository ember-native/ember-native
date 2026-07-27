import { Application } from '@nativescript/core';
import { registerTestRunner } from './services/test-runner-registry';

// Vite-only, bundle-mode-only entry point (this package's own port of
// upstream @nativescript/unit-test-runner, published standalone as
// ember-native-unit-test-runner but always consumed under the literal
// @nativescript/unit-test-runner name - see
// demo-app/vite-plugins/unit-test-runner-context.ts's docstring for why -
// see also VITE_MIGRATION_NOTES.md "Our own unit test runner" section). No
// `require.context`
// registration here: under this project's Vite test bundler,
// `demo-app/vite-plugins/unit-test-runner-context.ts` registers this
// package's own `app/*.{js,css,xml}` files ahead of time instead, since
// `require.context` is a webpack-only API this project no longer uses at
// all.
export function runTestApp(options = {}) {
  if (options?.runTests) {
    registerTestRunner(options.runTests);
  }
  Application.run({ moduleName: 'bundle-app-root' });
}
