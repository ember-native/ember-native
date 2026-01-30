
import { _ as _defineProperty } from './_rollupPluginBabelHelpers-ClPBvGFm.js';
import * as loader from 'loader.js';
import { registerElements } from './dom/setup-registry.js';
import { SimpleDynamicAttribute } from '@glimmer/runtime';
import ElementNode from './dom/nodes/ElementNode.js';
import { _backburner } from '@ember/runloop';
import DocumentNode from './dom/nodes/DocumentNode.js';

globalThis.registerBundlerModules = () => null;
globalThis.structuredClone = x => JSON.parse(JSON.stringify(x));

// this is used by warp-drive, and should somehow be setup by ember.js. did not figure out where...
globalThis.warn = (...args) => console.warn(...args);

// Polyfill console.warn if not available
if (typeof console.warn === 'undefined') {
  console.warn = function (...args) {
    console.log('[WARN]', ...args);
  };
}

// Polyfill queueMicrotask for async operations
if (typeof globalThis.queueMicrotask === 'undefined') {
  globalThis.queueMicrotask = callback => {
    Promise.resolve().then(callback).catch(err => {
      setTimeout(() => {
        throw err;
      }, 0);
    });
  };
}

// Polyfill ReadableStream for fetch API
if (typeof globalThis.ReadableStream === 'undefined') {
  class ReadableStream {
    constructor(underlyingSource) {
      _defineProperty(this, "_locked", false);
      _defineProperty(this, "_reader", null);
    } // Basic implementation for compatibility
    get locked() {
      return this._locked;
    }
    getReader() {
      if (this._locked) {
        throw new TypeError('ReadableStream is locked');
      }
      this._locked = true;
      this._reader = {
        read: () => Promise.resolve({
          done: true,
          value: undefined
        }),
        releaseLock: () => {
          this._locked = false;
        },
        closed: Promise.resolve()
      };
      return this._reader;
    }
    cancel(reason) {
      return Promise.resolve();
    }
  }
  globalThis.ReadableStream = ReadableStream;
}

// Polyfill WritableStream for fetch API
if (typeof globalThis.WritableStream === 'undefined') {
  class WritableStream {
    constructor(underlyingSink) {
      _defineProperty(this, "_locked", false);
      _defineProperty(this, "_writer", null);
    } // Basic implementation for compatibility
    get locked() {
      return this._locked;
    }
    getWriter() {
      if (this._locked) {
        throw new TypeError('WritableStream is locked');
      }
      this._locked = true;
      this._writer = {
        write: chunk => Promise.resolve(),
        close: () => Promise.resolve(),
        abort: reason => Promise.resolve(),
        releaseLock: () => {
          this._locked = false;
        },
        closed: Promise.resolve(),
        ready: Promise.resolve()
      };
      return this._writer;
    }
    abort(reason) {
      return Promise.resolve();
    }
  }
  globalThis.WritableStream = WritableStream;
}

// Polyfill TransformStream for fetch API
if (typeof globalThis.TransformStream === 'undefined') {
  class TransformStream {
    constructor(transformer) {
      _defineProperty(this, "readable", void 0);
      _defineProperty(this, "writable", void 0);
      this.readable = new globalThis.ReadableStream();
      this.writable = new globalThis.WritableStream();
    }
  }
  globalThis.TransformStream = TransformStream;
}

// Polyfill EventTarget for AbortSignal
if (typeof globalThis.EventTarget === 'undefined') {
  class EventTarget {
    constructor() {
      _defineProperty(this, "_listeners", new Map());
    }
    addEventListener(type, listener) {
      if (!this._listeners.has(type)) {
        this._listeners.set(type, new Set());
      }
      this._listeners.get(type).add(listener);
    }
    removeEventListener(type, listener) {
      const listeners = this._listeners.get(type);
      if (listeners) {
        listeners.delete(listener);
      }
    }
    dispatchEvent(event) {
      const listeners = this._listeners.get(event.type);
      if (listeners) {
        listeners.forEach(listener => listener(event));
      }
      return true;
    }
  }
  globalThis.EventTarget = EventTarget;
}

// Polyfill AbortController for WarpDrive requests
if (typeof globalThis.AbortController === 'undefined') {
  class AbortController {
    constructor() {
      _defineProperty(this, "signal", void 0);
      this.signal = new AbortSignal();
    }
    abort(reason) {
      this.signal._aborted = true;
      this.signal._reason = reason;
      if (this.signal.onabort) {
        this.signal.onabort();
      }
      // Dispatch abort event
      const event = {
        type: 'abort',
        target: this.signal
      };
      this.signal['dispatchEvent'](event);
    }
  }
  class AbortSignal extends globalThis.EventTarget {
    constructor(...args) {
      super(...args);
      _defineProperty(this, "_aborted", false);
      _defineProperty(this, "_reason", undefined);
      _defineProperty(this, "onabort", null);
    }
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
  globalThis.AbortController = AbortController;
  globalThis.AbortSignal = AbortSignal;
}
function setup() {
  globalThis.requireModule = loader.require;
  globalThis.requirejs = loader.require;
  globalThis.define = loader.define;
  globalThis.document = new DocumentNode();
  globalThis.Element = ElementNode;
  globalThis.Node = ElementNode;
  globalThis.HTMLElement = ElementNode;
  globalThis.NodeList = Array;
  function handleBackburnerErrors() {
    const next = _backburner['_platform'].next;
    _backburner['_platform'].next = function (...args) {
      const p = next.call(this, ...args);
      p.catch(console.error);
      return p;
    };
  }
  handleBackburnerErrors();
  SimpleDynamicAttribute.prototype.set = function (dom, value) {
    const {
      name,
      namespace
    } = this.attribute;
    dom.__setAttribute(name, value, namespace);
  };
  SimpleDynamicAttribute.prototype.update = function (value) {
    const normalizedValue = value;
    const {
      element: element,
      name: name
    } = this.attribute;
    if (null === normalizedValue) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, normalizedValue);
    }
  };
  class Window {}
  class MouseEvent {
    constructor(type, eventOpts) {
      _defineProperty(this, "type", void 0);
      _defineProperty(this, "eventOpts", void 0);
      if (type === 'click') {
        type = 'tap';
      }
      this.type = type;
      this.eventOpts = eventOpts;
    }
  }
  const g = globalThis;
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
    protocol: 'none'
  };
  const document = new DocumentNode();
  document.location = globalThis.window.location;
  g.__emberNative = {
    installGlobal() {
      globalThis.window = globalThis;
      globalThis.document = document;
    }
  };
  g.__emberNative.installGlobal();
  registerElements();
}

export { setup };
//# sourceMappingURL=setup.js.map
