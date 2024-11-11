import * as loader from 'loader.js';
import { registerElements } from './dom/setup-registry.ts';
import { SimpleDynamicAttribute } from '@glimmer/runtime';
import ElementNode from './dom/nodes/ElementNode.ts';
import { _backburner } from '@ember/runloop';

export function setup() {
  globalThis.requireModule = loader.require;
  globalThis.requirejs = loader.require;
  globalThis.define = loader.define;

  globalThis.Element = ElementNode as any;
  globalThis.Node = ElementNode as any;
  globalThis.HTMLElement = ElementNode as any;

  function handleBackburnerErrors() {
    const next = _backburner['_platform'].next;
    _backburner['_platform'].next = function (...args: any) {
      const p = next.call(this, ...args);
      p.catch(console.error);
      return p;
    };
  }
  handleBackburnerErrors();

  SimpleDynamicAttribute.prototype.set = function (dom, value, _env) {
    const { name, namespace } = this.attribute;
    dom.__setAttribute(name, value as any, namespace);
  };

  SimpleDynamicAttribute.prototype.update = function (value, _env) {
    const normalizedValue = value;
    const { element: element, name: name } = this.attribute;
    if (null === normalizedValue) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, normalizedValue as string);
    }
  };

  registerElements();
}
