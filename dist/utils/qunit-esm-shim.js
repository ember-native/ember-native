// qunit's own UMD build (qunit/qunit/qunit.js) picks its export mechanism at
// runtime, inside a nested `exportQUnit()` function called from its own
// module body - never a statically-analyzable top-level `module.exports =`
// assignment. @rollup/plugin-commonjs (wired up by @nativescript/vite)
// can't see through that, so it falls back to its dynamic/lazy interop mode:
// the transformed module only exposes a lazy `__require()` accessor, not
// real named exports (same bug class as json-to-ast, see
// json-to-ast-esm-shim.js one file up, and @nativescript/unit-test-runner's
// old config.js). ember-qunit's own dist/*.js files do
// `import * as QUnit from 'qunit'` and then read members straight off that
// namespace object (`config`, `module`, `on`, `start`, `test`, `testDone`,
// `testStart`, `done`) - under the lazy fallback, the namespace only has a
// `__require` property, so every one of those reads used to be `undefined`
// (previously worked around by patching all five files in
// patches/ember-qunit@9.0.4.patch to call `__require()` themselves).
//
// This shim reimplements the same fix once, as a real ES module with static
// named exports matching what ember-qunit actually reads, so no patch is
// needed on ember-qunit itself. Aliased from the bare `qunit` specifier in
// vite.config.js so every `import ... from 'qunit'` (ember-qunit's included)
// resolves here instead.
//
// Two more environment gaps are handled here too, both because qunit.js's
// own `window && document` browser-detection doesn't hold up under
// NativeScript's DOM shims (see earlyGlobalsBanner() in vite.config.js for
// the same shape of problem in @ember/test-helpers):
//  - `QUnit.urlParams` is only ever populated from a real browser
//    `location`; ember-qunit's own qunit-configuration.js reads
//    `QUnit.urlParams.devmode` unconditionally, so this defaults it to `{}`
//    instead of leaving it `undefined`.
//  - qunit.js only assigns itself to `window.QUnit` (the bare global this
//    repo's own `*-test.gts` files reference directly, the standard
//    Ember-CLI convention) when it detects that browser-like environment;
//    this assigns `globalThis.QUnit` unconditionally instead.
import { __require } from 'qunit/qunit/qunit.js';

const QUnit = __require();
if (!QUnit.urlParams) {
  QUnit.urlParams = {};
}
globalThis.QUnit = QUnit;

export default QUnit;
export const config = QUnit.config;
export const module = QUnit.module;
export const on = QUnit.on;
export const start = QUnit.start;
export const test = QUnit.test;
export const testDone = QUnit.testDone;
export const testStart = QUnit.testStart;
export const urlParams = QUnit.urlParams;
export const done = QUnit.done;
