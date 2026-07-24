// Test-only entry content, selected via `vite.test.config.ts`'s
// `demo-app-entry` alias (see `app/boot.js` for why this indirection exists
// instead of a runtime branch inside one shared file). Lives outside `app/`
// (alongside its `boot-app.js` counterpart) - see that file's docstring for
// why: Ember CLI's classic module-compat registry eagerly imports every
// file under `app/` regardless of which Vite config is active, and a real
// static import here would otherwise pull the entire qunit/ember-qunit/
// unit-test-runner graph into production builds too.
//
// Statically importing `./app/test.js` - instead of the previous shared
// `boot.js`'s dynamic `import('./test.js')` - is the fix for a real,
// reproducible on-device crash: `@nativescript/unit-test-runner`'s
// `Application.run({ moduleName: "bundle-app-root" })` (which registers
// `NativeScriptActivity`'s JS-extend wrapper for a test run) needs to run
// before Android tries to instantiate that Activity, and a dynamic import
// doesn't resolve in time. A static import is evaluated synchronously as
// part of this module's own linking, matching how webpack's synchronous
// `require.context`-based test entry always behaved - see
// VITE_MIGRATION_NOTES.md's "eager-vs-lazy-import problem" section for the
// full diagnostic history.
//
// Imported *before* `./app/test.js` (whose graph eventually reaches
// `@nativescript/unit-test-runner`'s `socket.io-client`/`engine.io-client`):
// this sets `global.WebSocket` to a real native implementation as a module
// top-level side effect. `engine.io-client`'s websocket transport reads
// `global.WebSocket` at its own module top level too, so it has to already
// exist by the time that module first evaluates - ESM import order
// guarantees that here since this line comes first textually. See the
// patched `io.connect(...)` call in
// `patches/@nativescript__unit-test-runner@4.0.1.patch` for why this
// replaces XHR polling instead of just polyfilling XHR itself.
import '@valor/nativescript-websockets';
import './app/test.js';

// Separately: `@nativescript/vite`'s own generated entry (`main-entry.js`)
// registers Android's `NativeScriptActivity` JS-extend wrapper differently
// depending on whether the active Vite config has HMR active. `vite.config.ts`
// (the real app build) always does, via `ember-vite-hmr`'s `hmr()` plugin,
// which takes a synchronous `require`-like path. `vite.test.config.ts` has
// no `hmr()` plugin, so it falls into the *other*, non-HMR branch instead -
// a genuinely deferred, real `import('@nativescript/core/ui/frame/activity.android.js?ns-keep')`
// (fired from a `launchEvent` listener / `setTimeout(..., 0)` registered
// before this file's own top-level code runs). Vite wraps that dynamic
// import in its `__vitePreload` runtime helper, which assumes a browser -
// unguarded `document.getElementsByTagName(...)`/`.querySelector(...)`/
// `.createElement("link")` to preload the target chunk's CSS deps - and
// throws on NativeScript's non-browser `document` shim
// (`TypeError: document.getElementsByTagName is not a function`, silently
// swallowed by `main-entry.js`'s own try/catch and merely logged), which
// means the Activity's JS-extend wrapper never actually gets registered,
// and Android's later attempt to instantiate it fails outright
// (`Failed to create JavaScript extend wrapper for class
// 'com/tns/NativeScriptActivity'`). This file's own top-level code below
// (like the `import` above) still runs synchronously, before the deferred
// import's `setTimeout(0)`/`launchEvent` trigger can fire, so patching
// no-op fallbacks in here is in time.
const document = globalThis.document;
if (typeof document.getElementsByTagName !== 'function') {
  document.getElementsByTagName = () => [];
}
if (typeof document.querySelector !== 'function') {
  document.querySelector = () => null;
}
if (!document.head) {
  document.head = { appendChild() {} };
}
// `document.createElement` already exists here - it's `ember-native`'s real
// element factory, used throughout the actual app to create native UI
// elements (`label`, `button`, ...) - so it can't be stubbed out wholesale.
// `__vitePreload` calls it with `"link"`, which isn't a real NativeScript
// component, and the real factory throws (`TypeError: No known component
// for element link.`) rather than returning null/undefined for an unknown
// tag. Wrap it: fall through to a stub only for tag names the real factory
// doesn't recognize, so real element creation elsewhere is untouched.
const nativeCreateElement = document.createElement.bind(document);
document.createElement = (tagName) => {
  try {
    return nativeCreateElement(tagName);
  } catch (e) {
    return { setAttribute() {}, relList: undefined };
  }
};
