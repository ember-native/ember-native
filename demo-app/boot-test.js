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
// Sets `global.WebSocket` to a real native implementation as a module
// top-level side effect - needed because `@nativescript/unit-test-runner`'s
// (our own local `unit-test-runner/` workspace package - see
// VITE_MIGRATION_NOTES.md's "Our own unit test runner" section)
// `io.connect(...)` call in `main-view-model.js` forces
// `transports: ['websocket']`, skipping engine.io-client's default
// XHR-polling handshake entirely (that XHR polling hangs indefinitely under
// NativeScript's XHR implementation, never fully root-caused - see
// VITE_MIGRATION_NOTES.md). Import position here does *not* guarantee this
// runs before `engine.io-client`'s websocket transport module evaluates -
// `@nativescript/unit-test-runner`'s own vite-context plugin eagerly
// registers `main-view-model.js` (and transitively `socket.io-client`) from
// elsewhere in the entry graph, often before this line runs. That's fine:
// `patches/engine.io-client@3.2.1.patch` makes the transport re-resolve
// `global.WebSocket` at actual connection time instead of caching it at
// module-load time, so it no longer matters when this import runs, only
// that it's run at all before a connection is attempted.
import '@valor/nativescript-websockets';
// `engine.io-parser@1.x` (pulled in by `engine.io-client@3.2.1`) resolves to
// its Node-oriented `lib/index.js`, not `lib/browser.js`, under this Vite
// pipeline (`@nativescript/vite` doesn't set the "browser" resolve
// condition/field, since NativeScript isn't a real browser environment) -
// `encodePacket` unconditionally calls `Buffer.isBuffer(...)`, even for
// plain string packets, and NativeScript's JS runtime has no `Buffer`
// global (webpack shims this automatically via `node-libs-browser`; Vite
// doesn't). A real environment gap, not a bundler-shape bug - polyfill it
// with the standalone `buffer` package rather than patching the dependency.
import * as bufferModule from 'buffer';
// Same CJS-interop fallback shape as `resolveCjsInterop` in
// `unit-test-runner/app/main-view-model.js` - Rollup can't statically prove
// a safe `default`/named binding for this package either.
global.Buffer = (bufferModule.default !== undefined ? bufferModule.default : bufferModule.__require ? bufferModule.__require() : bufferModule).Buffer;
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
} else {
  // Unlike `getElementsByTagName`, `ember-native`'s real `document` (a
  // `DocumentNode`) *does* already implement `querySelector` - real app
  // code depends on it, so it can't be stubbed out wholesale like the guard
  // above does. But `__vitePreload` only ever calls it with two specific,
  // hardcoded CSS-selector-syntax strings (`meta[property=csp-nonce]`,
  // `link[href="..."]...`) that `DocumentNode.querySelector` was never
  // designed to parse - neither starts with `.`/`#`, so it falls through to
  // `getElementByTagName(selector)` with the *entire* selector string as a
  // literal tag name, which never matches anything, but still walks the
  // whole tree via `elementIterator` first - and can throw outright
  // ("el.childNodes is not iterable") depending on what's in that tree at
  // the time (observed on-device during a `setupRenderingTest` test, whose
  // isolated render root isn't a fully-initialized `DocumentNode`). Both
  // selectors are for optional preload features (CSP nonce, dedup-checking
  // an already-added `<link>`) this app will never need - intercept them
  // ahead of the real implementation instead of trying to make
  // `DocumentNode` itself tolerate arbitrary CSS selector syntax.
  const nativeQuerySelector = document.querySelector.bind(document);
  document.querySelector = (selector) => {
    if (typeof selector === 'string' && (selector.startsWith('meta[') || selector.startsWith('link['))) {
      return null;
    }
    return nativeQuerySelector(selector);
  };
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
    // `__vitePreload`'s CSS dep preloading does
    // `new Promise((res, rej) => { link.addEventListener('load', res); ... })`
    // and awaits it before proceeding - a plain no-op `addEventListener`
    // would leave that promise permanently unsettled (nothing ever calls
    // `res`), deadlocking every dynamic `import()` that has a CSS dep
    // forever (confirmed on-device: a 30s karma "no message" timeout, no
    // further progress). Nothing real is loading here (this stub `link`
    // isn't attached to anything), so treat every attach as an immediate,
    // async "already loaded".
    return {
      setAttribute() {},
      addEventListener(type, cb) {
        if (type === 'load') Promise.resolve().then(cb);
      },
      removeEventListener() {},
      relList: undefined,
    };
  }
};

// `__vitePreload`'s error path (`handlePreloadError`, used for both CSS-dep
// preload failures and the dynamically-imported module itself rejecting)
// constructs a real DOM `Event` and dispatches it via `globalThis.dispatchEvent`
// so app code can opt out of the default rethrow via `preventDefault()` -
// neither exists under NativeScript. Without this, any dynamic `import()`
// that ends up rejecting for a genuine, unrelated reason gets its real error
// masked by a second, identical-looking `ReferenceError: Event is not
// defined` thrown from inside the error handler itself. This app never
// listens for `vite:preloadError`, so a minimal, inert shim is enough to let
// the real underlying error (if any) propagate via `throw err` below it.
if (typeof globalThis.Event === 'undefined') {
  globalThis.Event = class Event {
    constructor(type, options) {
      this.type = type;
      this.cancelable = !!(options && options.cancelable);
      this.defaultPrevented = false;
    }
    preventDefault() {
      this.defaultPrevented = true;
    }
  };
}
if (typeof globalThis.dispatchEvent !== 'function') {
  globalThis.dispatchEvent = () => true;
}
