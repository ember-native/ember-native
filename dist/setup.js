import * as loader from 'loader.js';
import { registerElements } from './dom/setup-registry.js';
import { SimpleDynamicAttribute } from '@glimmer/runtime';
import ElementNode from './dom/nodes/ElementNode.js';
import { _backburner } from '@ember/runloop';

function setup() {
  globalThis.requireModule = loader.require;
  globalThis.requirejs = loader.require;
  globalThis.define = loader.define;
  globalThis.Element = ElementNode;
  globalThis.Node = ElementNode;
  globalThis.HTMLElement = ElementNode;
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
  registerElements();
}

export { setup };
//# sourceMappingURL=setup.js.map
