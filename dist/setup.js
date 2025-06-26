
import { _ as _defineProperty } from './_rollupPluginBabelHelpers-ClPBvGFm.js';
import * as loader from 'loader.js';
import { registerElements } from './dom/setup-registry.js';
import { SimpleDynamicAttribute } from '@glimmer/runtime';
import ElementNode from './dom/nodes/ElementNode.js';
import { _backburner } from '@ember/runloop';
import DocumentNode from './dom/nodes/DocumentNode.js';

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
  SimpleDynamicAttribute.prototype.set = function (dom, value, _env) {
    const {
      name,
      namespace
    } = this.attribute;
    dom.__setAttribute(name, value, namespace);
  };
  SimpleDynamicAttribute.prototype.update = function (value, _env) {
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
