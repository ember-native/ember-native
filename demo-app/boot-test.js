// Test-only entry content, selected via `vite.test.config.ts`'s
// `ember-native-app-entry` alias. Lives outside `app/` (alongside its
// `boot-app.js` counterpart) because Ember CLI's classic module-compat
// registry eagerly imports every file under `app/` regardless of which Vite
// config is active - keeping the real entry content out of `app/` keeps the
// unused one out of both builds.
//
// Statically importing `./app/test.js` (rather than dynamically) matters:
// the test runner needs to register itself with NativeScript before Android
// tries to instantiate its test Activity, and only a static import is
// guaranteed to resolve in time.

// Installs a real native WebSocket implementation, needed by the test
// runner's socket connection back to the karma test host.
import '@valor/nativescript-websockets';
// NativeScript's JS runtime has no `Buffer` global; polyfill it for the test
// runner's socket transport, which expects one.
import * as bufferModule from 'buffer';
globalThis.Buffer = (bufferModule.default !== undefined ? bufferModule.default : bufferModule.__require ? bufferModule.__require() : bufferModule).Buffer;
import './app/test.js';

// Vite's dynamic-import "module preload" helper assumes a browser DOM
// (`document.getElementsByTagName`/`querySelector`/`createElement`, and a
// real `Event`/`dispatchEvent`) when preloading a chunk's CSS/asset
// dependencies. NativeScript's `document` shim doesn't implement all of
// that, so provide minimal stubs - real app element creation and
// `querySelector` usage elsewhere are left untouched.
const document = globalThis.document;
if (typeof document.getElementsByTagName !== 'function') {
  document.getElementsByTagName = () => [];
}
if (typeof document.querySelector !== 'function') {
  document.querySelector = () => null;
} else {
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
const nativeCreateElement = document.createElement.bind(document);
document.createElement = (tagName) => {
  try {
    return nativeCreateElement(tagName);
  } catch {
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
