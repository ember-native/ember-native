// Import order here matters - see ./tests/qunit-browser-shim.js for why it
// has to run first, and ./native/setup-ember-native (via `ember-native`'s
// `setup()`) has to run before ./tests/test-helper.
//
// Under Vite, `@nativescript/unit-test-runner`'s own module registration
// (`Application.run({ moduleName: "bundle-app-root" })` below, transitively
// via ./tests/test-helper) needs `virtual:ns-unit-test-runner-context`
// registered first - done from vite.test.config.ts's plugin instead of a
// static import here (this file is shared with the webpack test path via
// @nativescript/unit-test-runner's own entrypoint-detection convention,
// which resolves `test.js` directly - a Vite-only `virtual:...` specifier
// here would break that build). See vite-plugins/unit-test-runner-context.ts.
import './tests/qunit-browser-shim';
import 'qunit';
import './native/setup-ember-native';
import './tests/test-helper';
