const { test } = require('node:test');
const assert = require('node:assert/strict');
const { javaProxySbgHint } = require('./javaproxy-sbg-hint.js');

// Trimmed down, but otherwise verbatim shape of @nativescript/core's real
// `application.android.js` (both `NativeScriptLifecycleCallbacksImpl` and
// `NativeScriptComponentCallbacksImpl`, the two classes whose missing SBG
// binding caused every release build to throw `LookedUpClassNotFound` at
// boot - see javaproxy-sbg-hint.js's own docstring for the full incident).
// This is a *production* regression test: it fixture-matches the exact
// compiled-JS shape that broke in production, not an idealized input.
const REAL_APPLICATION_ANDROID_JS = `
let NativeScriptLifecycleCallbacks_;
function initNativeScriptLifecycleCallbacks() {
    if (NativeScriptLifecycleCallbacks_) {
        return NativeScriptLifecycleCallbacks_;
    }
    var NativeScriptLifecycleCallbacksImpl = (function (_super) {
        __extends(NativeScriptLifecycleCallbacksImpl, _super);
        function NativeScriptLifecycleCallbacksImpl() {
            return (_super !== null && _super.apply(this, arguments)) || this;
        }
        NativeScriptLifecycleCallbacksImpl.prototype.onActivityCreated = function (activity, savedInstanceState) {};
        NativeScriptLifecycleCallbacksImpl.prototype.onActivityDestroyed = function (activity) {};
        NativeScriptLifecycleCallbacksImpl = __decorate([
            JavaProxy("org.nativescript.NativeScriptLifecycleCallbacks")
        ], NativeScriptLifecycleCallbacksImpl);
        return NativeScriptLifecycleCallbacksImpl;
    }(android.app.Application.ActivityLifecycleCallbacks));
    NativeScriptLifecycleCallbacks_ = NativeScriptLifecycleCallbacksImpl;
    return NativeScriptLifecycleCallbacks_;
}
let NativeScriptComponentCallbacks_;
function initNativeScriptComponentCallbacks() {
    if (NativeScriptComponentCallbacks_) {
        return NativeScriptComponentCallbacks_;
    }
    var NativeScriptComponentCallbacksImpl = (function (_super) {
        __extends(NativeScriptComponentCallbacksImpl, _super);
        function NativeScriptComponentCallbacksImpl() {
            return (_super !== null && _super.apply(this, arguments)) || this;
        }
        NativeScriptComponentCallbacksImpl.prototype.onLowMemory = function () {};
        NativeScriptComponentCallbacksImpl.prototype.onTrimMemory = function (level) {};
        NativeScriptComponentCallbacksImpl.prototype.onConfigurationChanged = function (newConfiguration) {};
        NativeScriptComponentCallbacksImpl = __decorate([
            JavaProxy("org.nativescript.NativeScriptComponentCallbacks")
        ], NativeScriptComponentCallbacksImpl);
        return NativeScriptComponentCallbacksImpl;
    }(android.content.ComponentCallbacks2));
    NativeScriptComponentCallbacks_ = NativeScriptComponentCallbacksImpl;
    return NativeScriptComponentCallbacks_;
}
`;

test('emits an SBG hint for every @JavaProxy-decorated class, with the real method list and superclass expression', () => {
  const output = javaProxySbgHint(REAL_APPLICATION_ANDROID_JS, 'application.android.js');
  assert.ok(output, 'expected a transform to be produced for real @nativescript/core source');

  assert.match(output, /if \(globalThis\.__sbgJavaProxyHintNeverTrue__\) \{/);

  assert.match(
    output,
    /\(android\.app\.Application\.ActivityLifecycleCallbacks\)\.extend\("org\.nativescript\.NativeScriptLifecycleCallbacks", \{ "onActivityCreated": function \(\) \{\}, "onActivityDestroyed": function \(\) \{\} \}\);/,
  );
  assert.match(
    output,
    /\(android\.content\.ComponentCallbacks2\)\.extend\("org\.nativescript\.NativeScriptComponentCallbacks", \{ "onLowMemory": function \(\) \{\}, "onTrimMemory": function \(\) \{\}, "onConfigurationChanged": function \(\) \{\} \}\);/,
  );

  // The hint must be dead code - SBG only needs to *see* the literal
  // `.extend(...)` text, it never actually has to run. A regression here
  // (guard flipped/removed) would double-register these classes against
  // @nativescript/core's own real, decorator-driven registration.
  assert.equal(globalThis.__sbgJavaProxyHintNeverTrue__, undefined);
  new Function(output)();
});

test('is a no-op for files with no @JavaProxy usage', () => {
  assert.equal(javaProxySbgHint('const x = 1;', 'unrelated.js'), null);
});

test('is a no-op for __decorate calls that reference a different decorator', () => {
  const code = `
    var Foo = (function (_super) {
      __extends(Foo, _super);
      Foo.prototype.bar = function () {};
      Foo = __decorate([SomeOtherDecorator("x")], Foo);
      return Foo;
    }(Base));
  `;
  assert.equal(javaProxySbgHint(code, 'unrelated.js'), null);
});
