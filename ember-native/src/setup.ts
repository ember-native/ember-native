import * as loader from 'loader.js';
import { registerElements } from './dom/setup-registry.ts';
// @ts-expect-error ignore
import { SimpleDynamicAttribute } from '@glimmer/runtime';
import ElementNode from './dom/nodes/ElementNode.ts';
import { _backburner } from '@ember/runloop';
import DocumentNode from './dom/nodes/DocumentNode.ts';

globalThis.registerBundlerModules = () => null;
globalThis.structuredClone = (x) => JSON.parse(JSON.stringify(x));

// this is used by warp-drive, and should somehow be setup by ember.js. did not figure out where...
globalThis.warn = (...args) => console.warn(...args);

// Polyfill console.warn if not available
if (typeof console.warn === 'undefined') {
  console.warn = function(...args: any[]) {
    console.log('[WARN]', ...args);
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
