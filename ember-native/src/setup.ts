import * as loader from 'loader.js';
import { registerElements } from './dom/setup-registry.ts';
// @ts-expect-error ignore
import { SimpleDynamicAttribute } from '@glimmer/runtime';
import ElementNode from './dom/nodes/ElementNode.ts';
import { _backburner } from '@ember/runloop';
import DocumentNode from './dom/nodes/DocumentNode.ts';

globalThis.registerBundlerModules = () => null;

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
