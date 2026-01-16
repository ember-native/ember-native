
import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-ClPBvGFm.js';
import { normalizeElementName, getViewMeta } from '../element-registry.js';

function* elementIterator(el) {
  yield el;
  for (const child of el.childNodes) {
    yield* elementIterator(child);
  }
}
class ViewNode {
  get textContent() {
    const contents = [];
    for (const el of elementIterator(this)) {
      contents.push(el.text || el.html);
    }
    return contents.filter(c => !!c).join(' ');
  }
  getElementById(id) {
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.id === id) return el;
    }
  }
  getElementByClass(klass) {
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.classList.contains(klass)) return el;
    }
  }
  getElementByTagName(tagName) {
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.tagName === tagName) return el;
    }
  }
  querySelector(selector) {
    if (selector.startsWith('.')) {
      return this.getElementByClass(selector.slice(1));
    }
    if (selector.startsWith('#')) {
      return this.getElementById(selector.slice(1));
    }
    return this.getElementByTagName(selector);
  }
  contains(_otherElement) {
    return false;
  }
  constructor() {
    _defineProperty(this, "attributes", void 0);
    _defineProperty(this, "args", void 0);
    _defineProperty(this, "template", void 0);
    _defineProperty(this, "nodeType", void 0);
    _defineProperty(this, "_tagName", void 0);
    _defineProperty(this, "childNodes", void 0);
    _defineProperty(this, "_ownerDocument", void 0);
    _defineProperty(this, "_meta", void 0);
    this.nodeType = null;
    this._tagName = null;
    this.parentNode = null;
    this.childNodes = [];
    this._ownerDocument = null;
    this._meta = null;
    this.attributes = [];
  }
  hasAttribute() {
    return false;
  }
  removeAttribute() {
    return false;
  }

  /* istanbul ignore next */
  toString() {
    return `${this.constructor.name}(${this.tagName})`;
  }
  set tagName(name) {
    this._tagName = normalizeElementName(name);
  }
  get tagName() {
    return this._tagName;
  }
  get firstChild() {
    return this.childNodes.length ? this.childNodes[0] : null;
  }
  get lastChild() {
    return this.childNodes.length ? this.childNodes[this.childNodes.length - 1] : null;
  }
  get nextSibling() {
    if (!this.parentNode) {
      return null;
    }
    const index = this.parentNode.childNodes.indexOf(this);
    if (index === -1 || index === this.parentNode.childNodes.length - 1) {
      return null;
    }
    return this.parentNode.childNodes[index + 1];
  }
  get prevSibling() {
    if (!this.parentNode) {
      return null;
    }
    const index = this.parentNode.childNodes.indexOf(this);
    if (index <= 0) {
      return null;
    }
    return this.parentNode.childNodes[index - 1];
  }
  get meta() {
    if (this._meta) {
      return this._meta;
    }
    return this._meta = getViewMeta(this.tagName);
  }
  get isConnected() {
    return Boolean(this.ownerDocument);
  }

  /* istanbul ignore next */
  get ownerDocument() {
    let el = this;
    while (el != null && el.nodeType !== 9) {
      el = el.parentNode || el._ownerDocument;
    }
    if (el?.nodeType === 9) {
      return el;
    }
    return null;
  }
  getAttribute(key) {
    return this[key];
  }

  /* istanbul ignore next */
  setAttribute(key, value) {
    this.attributes.push({
      nodeName: key,
      nodeValue: value
    });
    this[key] = value;
  }
  onInsertedChild(_childNode, _index) {}
  onRemovedChild(_childNode) {}
  insertBefore(childNode, referenceNode) {
    if (!childNode) {
      throw new Error(`Can't insert child.`);
    }

    // in some rare cases insertBefore is called with a null referenceNode
    // this makes sure that it get's appended as the last child
    if (!referenceNode) {
      return this.appendChild(childNode);
    }
    if (referenceNode.parentNode !== this) {
      throw new Error(`Can't insert child, because the reference node has a different parent.`);
    }
    if (childNode.parentNode && childNode.parentNode !== this) {
      throw new Error(`Can't insert child, because it already has a different parent.`);
    }
    if (childNode.parentNode === this) {
      // we don't need to throw an error here, because it is a valid case
      // for example when switching the order of elements in the tree
      // fixes #127 - see for more details
      // fixes #240
      // throw new Error(`Can't insert child, because it is already a child.`)
      this.removeChild(childNode);
    }
    const index = this.childNodes.indexOf(referenceNode);
    this.childNodes.splice(index, 0, childNode);
    childNode.parentNode = this;
    this.onInsertedChild(childNode, index);
  }
  appendChild(childNode) {
    if (!childNode) {
      throw new Error(`Can't append null child.`);
    }
    if (childNode.parentNode && childNode.parentNode !== this) {
      throw new Error(`Can't append child, because it already has a different parent.`);
    }
    if (childNode.parentNode === this) {
      // we don't need to throw an error here, because it is a valid case
      // for example when switching the order of elements in the tree
      // fixes #127 - see for more details
      // fixes #240
      // throw new Error(`Can't append child, because it is already a child.`)
      this.removeChild(childNode);
    }
    this.childNodes.push(childNode);
    childNode.parentNode = this;
    this.onInsertedChild(childNode, this.childNodes.length - 1);
  }
  removeChild(childNode) {
    if (!childNode) {
      throw new Error(`Can't remove <null> child.`);
    }
    if (!childNode.parentNode) {
      throw new Error(`Can't remove child, because it has no parent.`);
    }
    if (childNode.parentNode !== this) {
      throw new Error(`Can't remove child, because it has a different parent.`);
    }
    childNode.parentNode = null;

    // reset the prevSibling and nextSibling. If not, a keep-alived component will
    // still have a filled nextSibling attribute so vue will not
    // insert the node again to the parent. See #220
    // childNode.prevSibling = null;
    // childNode.nextSibling = null;

    this.childNodes = this.childNodes.filter(node => node !== childNode);
    this.onRemovedChild(childNode);
  }
  clear(node) {
    while (node.childNodes.length) {
      this.clear(node.firstChild);
    }
    node.parentNode.removeChild(node);
  }
  removeChildren() {
    while (this.childNodes.length) {
      this.clear(this.firstChild);
    }
  }
  firstElement() {
    for (const child of this.childNodes) {
      if (child.nodeType == 1) {
        return child;
      }
    }
    return null;
  }
  getBoundingClientRect() {
    return null;
  }
}

export { ViewNode as default };
//# sourceMappingURL=ViewNode.js.map
