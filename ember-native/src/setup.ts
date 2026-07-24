// A direct subpath import, not the bare `loader.js` specifier: loader.js is a
// classic v1 Ember addon (contributes its content via `app.import()`/the
// vendor tree, see its own index.js). Embroider's compat adapter auto-upgrades
// v1 addons into a v2 "rewritten package" with no `main`/`module`/`exports`
// entry (they're not meant to be `import`ed directly), so resolving the bare
// package name under @embroider/vite's real resolver fails with "Failed to
// resolve entry for package 'loader.js'". The subpath below reaches the real
// file directly, sidestepping the addon-rewrite redirect entirely.
//
// Neither a namespace nor a default import of the module itself works under
// @nativescript/vite (Rollup):
// - `import * as loader`: build.js has no statically-detectable named
//   exports (it's a CJS file assigning `module.exports = { require, define }`
//   from inside a UMD factory function), so @rollup/plugin-commonjs can't
//   verify a namespace import's `.require`/`.define` property accesses
//   against a known export list - and rather than leaving them as real
//   runtime property lookups, Rollup inlines each as a literal `void 0`,
//   silently turning `loader.require`/`loader.define` into `undefined` with
//   no build warning or runtime error at the call site (only later, when
//   something tries to *call* `undefined`).
// - `import loader from '...'` (default import): build.js's internal nested
//   `require()` calls (a vendored grapheme-splitter helper) put it in
//   @rollup/plugin-commonjs's lazy "withRequireFunction" wrapped mode, which
//   only emits a real `default` export via a synthetic entry-proxy module
//   that the plugin's own `resolveId` hook generates - but @embroider/vite's
//   resolver has `enforce: 'pre'` and always claims resolution first, so
//   that proxy is never created (see json-to-ast-esm-shim.js for the same
//   failure mode, in a case where we don't control the import site and have
//   to fix it via an alias instead).
// `__require` sidesteps both: it's a *named* export the transform always
// adds to the wrapped module's own compiled output (regardless of who
// resolved the id), so importing it directly and calling it ourselves avoids
// the whole resolveId-ordering problem.
//
// @nativescript/webpack (still used for `nativescript test android`, see
// nativescript.test.config.ts/webpack.config.js and VITE_MIGRATION_NOTES.md)
// has no `@rollup/plugin-commonjs`, so it never synthesizes `__require` -
// there `requireLoader` below is simply `undefined` (a normal
// missing-export property read; webpack warns, doesn't error). Fall back to
// a namespace import there instead: webpack's namespace-import interop for a
// CJS module is a real runtime object (`.require`/`.define` are genuine
// property lookups, not statically inlined the way Rollup does it), so it
// resolves correctly. This can't just be `import loaderModule from '...'`
// (a *default* import) instead: unlike the namespace import above, Rollup's
// default-import handling for this file hits the `withRequireFunction`
// proxy problem described above and fails the *build* outright with
// `"default" is not exported by .../loader.js`, even though `requireLoader`
// (checked first, below) would've made this branch dead code at runtime -
// Rollup still statically resolves every import it sees regardless of
// which branch runtime logic ends up taking.
import { __require as requireLoader } from 'loader.js/dist/loader/loader.js';
import * as loaderModule from 'loader.js/dist/loader/loader.js';
const loader = (requireLoader ? requireLoader() : loaderModule) as unknown as { require: unknown; define: unknown };
import { registerElements } from './dom/setup-registry.ts';
import { SimpleDynamicAttribute } from '@glimmer/runtime';
import ElementNode from './dom/nodes/ElementNode.ts';
import { _backburner } from '@ember/runloop';
import DocumentNode from './dom/nodes/DocumentNode.ts';

// ember-native's own root view is created via `Application.run({ create: ... })`,
// so it never needs @nativescript/core's moduleName/XML-based module registry.
// Only stub this out as a fallback when the real implementation isn't present -
// @nativescript/unit-test-runner's own bundle-app-root/bundle-main-page XML pages
// (used to host the QUnit test runner UI) rely on the real one to resolve.
if (typeof globalThis.registerBundlerModules !== 'function') {
  globalThis.registerBundlerModules = () => null;
}
globalThis.structuredClone = (x) => JSON.parse(JSON.stringify(x));

// this is used by warp-drive, and should somehow be setup by ember.js. did not figure out where...
globalThis.warn = (...args) => console.warn(...args);

// Polyfill console.warn if not available
if (typeof console.warn === 'undefined') {
  console.warn = function(...args: any[]) {
    console.log('[WARN]', ...args);
  };
}

// Polyfill console.debug if not available. The NativeScript Android
// runtime's console global only implements log/warn/error - Ember's own
// internals (reached from `Application.create()`, i.e. on every app boot,
// not just in some rare code path) call `console.debug(...)` directly,
// which throws `console.debug is not a function` and aborts app boot with
// no further detail (the native module loader only reports it as a generic
// "Module evaluation promise rejected").
if (typeof console.debug === 'undefined') {
  console.debug = function(...args: any[]) {
    console.log('[DEBUG]', ...args);
  };
}

// Polyfill queueMicrotask for async operations
if (typeof globalThis.queueMicrotask === 'undefined') {
  globalThis.queueMicrotask = (callback: () => void) => {
    Promise.resolve().then(callback).catch(err => {
      setTimeout(() => { throw err; }, 0);
    });
  };
}

// Polyfill ReadableStream for fetch API
if (typeof globalThis.ReadableStream === 'undefined') {
  class ReadableStream {
    private _locked = false;
    private _reader: any = null;

    constructor(underlyingSource?: any) {
      // Basic implementation for compatibility
    }

    get locked() {
      return this._locked;
    }

    getReader() {
      if (this._locked) {
        throw new TypeError('ReadableStream is locked');
      }
      this._locked = true;
      this._reader = {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => { this._locked = false; },
        closed: Promise.resolve()
      };
      return this._reader;
    }

    cancel(reason?: any) {
      return Promise.resolve();
    }
  }

  globalThis.ReadableStream = ReadableStream as any;
}

// Polyfill WritableStream for fetch API
if (typeof globalThis.WritableStream === 'undefined') {
  class WritableStream {
    private _locked = false;
    private _writer: any = null;

    constructor(underlyingSink?: any) {
      // Basic implementation for compatibility
    }

    get locked() {
      return this._locked;
    }

    getWriter() {
      if (this._locked) {
        throw new TypeError('WritableStream is locked');
      }
      this._locked = true;
      this._writer = {
        write: (chunk: any) => Promise.resolve(),
        close: () => Promise.resolve(),
        abort: (reason?: any) => Promise.resolve(),
        releaseLock: () => { this._locked = false; },
        closed: Promise.resolve(),
        ready: Promise.resolve()
      };
      return this._writer;
    }

    abort(reason?: any) {
      return Promise.resolve();
    }
  }

  globalThis.WritableStream = WritableStream as any;
}

// Polyfill TransformStream for fetch API
if (typeof globalThis.TransformStream === 'undefined') {
  class TransformStream {
    readable: ReadableStream;
    writable: WritableStream;

    constructor(transformer?: any) {
      this.readable = new (globalThis.ReadableStream as any)();
      this.writable = new (globalThis.WritableStream as any)();
    }
  }

  globalThis.TransformStream = TransformStream as any;
}

// Polyfill EventTarget for AbortSignal
if (typeof globalThis.EventTarget === 'undefined') {
  class EventTarget {
    private _listeners: Map<string, Set<(event: any) => void>> = new Map();

    addEventListener(type: string, listener: (event: any) => void) {
      if (!this._listeners.has(type)) {
        this._listeners.set(type, new Set());
      }
      this._listeners.get(type)!.add(listener);
    }

    removeEventListener(type: string, listener: (event: any) => void) {
      const listeners = this._listeners.get(type);
      if (listeners) {
        listeners.delete(listener);
      }
    }

    dispatchEvent(event: any) {
      const listeners = this._listeners.get(event.type);
      if (listeners) {
        listeners.forEach(listener => listener(event));
      }
      return true;
    }
  }

  globalThis.EventTarget = EventTarget as any;
}

// Polyfill AbortController for WarpDrive requests
if (typeof globalThis.AbortController === 'undefined') {
  class AbortController {
    signal: AbortSignal;

    constructor() {
      this.signal = new AbortSignal();
    }

    abort(reason?: any) {
      (this.signal as any)._aborted = true;
      (this.signal as any)._reason = reason;
      if ((this.signal as any).onabort) {
        (this.signal as any).onabort();
      }
      // Dispatch abort event
      const event = { type: 'abort', target: this.signal };
      this.signal['dispatchEvent'](event);
    }
  }

  class AbortSignal extends (globalThis.EventTarget as any) {
    _aborted = false;
    _reason: any = undefined;
    onabort: (() => void) | null = null;

    get aborted() {
      return this._aborted;
    }

    get reason() {
      return this._reason;
    }

    throwIfAborted() {
      if (this._aborted) {
        throw this._reason || new Error('Aborted');
      }
    }
  }

  globalThis.AbortController = AbortController as any;
  globalThis.AbortSignal = AbortSignal as any;
}

export function setup() {
  globalThis.requireModule = loader.require;
  globalThis.requirejs = loader.require;
  globalThis.define = loader.define;

  globalThis.document = new DocumentNode() as unknown as Document;
  globalThis.Element = ElementNode as any;
  globalThis.Node = ElementNode as any;
  globalThis.HTMLElement = ElementNode as any;
  globalThis.NodeList = Array as any;

  function handleBackburnerErrors() {
    const next = _backburner['_platform'].next;
    _backburner['_platform'].next = function (...args: any) {
      const p = next.call(this, ...args);
      p.catch(console.error);
      return p;
    };
  }
  handleBackburnerErrors();

  SimpleDynamicAttribute.prototype.set = function (dom, value) {
    const { name, namespace } = this.attribute;
    dom.__setAttribute(name, value as any, namespace);
  };

  SimpleDynamicAttribute.prototype.update = function (value) {
    const normalizedValue = value;
    const { element: element, name: name } = this.attribute;
    if (null === normalizedValue) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, normalizedValue as string);
    }
  };

  class Window {}

  class MouseEvent {
    type: any;
    eventOpts: any;
    constructor(type: string, eventOpts: any) {
      if (type === 'click') {
        type = 'tap';
      }
      this.type = type;
      this.eventOpts = eventOpts;
    }
  }

  const g = globalThis as any;
  g.Window = Window;
  g.MouseEvent = MouseEvent;
  g.window = globalThis;
  g.window.location = {
    href: '',
    host: '',
    hostname: '',
    pathname: '',
    search: '',
    origin: '',
    protocol: 'none',
  } as any;
  const document = new DocumentNode() as unknown as Document;
  (document as unknown as any).location = globalThis.window.location;

  g.__emberNative = {
    installGlobal() {
      (globalThis as any).window = globalThis;
      (globalThis as any).document = document;
    },
  };
  g.__emberNative.installGlobal();

  registerElements();
}
