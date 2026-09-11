import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-apNPIsxw.js';
import { normalizeElementName, getViewMeta } from '../element-registry.js';

function* elementIterator(el) {
  yield el;
  // Some nodes reachable during a test run (observed via `@ember/test-helpers`'
  // `visit()`/`getRootElement()` walking the tree before the app's own render
  // has fully settled) don't carry a real, ViewNode-derived `childNodes`
  // array - treat that as a leaf instead of crashing the whole walk with
  // "childNodes is not iterable" and losing every match past that point.
  if (!Array.isArray(el.childNodes)) {
    return;
  }
  for (const child of el.childNodes) {
    yield* elementIterator(child);
  }
}
class ViewNode {
  get textContent() {
    // Reads via `getAttribute`, not the plain `.text`/`.html` properties directly:
    // `NativeElementNode#getAttribute` reflects the underlying native view's real property value
    // (e.g. a `<label>`'s displayed text), which a dynamic `text={{...}}` binding updates via
    // `setAttribute` - it never touches a plain `.text` field on the JS wrapper object itself, so
    // reading that field directly always read back `undefined` for a native element whose content
    // was set the normal way, no matter what the native view actually displayed. Plain nodes
    // without a `NativeElementNode`-specific override (e.g. `TextNode`) fall back to `ViewNode`'s
    // own `getAttribute`, which is just `this[key]` - the same plain-property read as before, so
    // this is a strict improvement, not a behavior change, for anything that isn't a native view.
    //
    // Only a leaf (no children) contributes its own text/html: a native widget given text content
    // as a child (e.g. `<button>hello</button>`) mirrors that child's content onto its own
    // `.text` - it's still kept as a real child `TextNode` too, so counting both the parent's own
    // `getAttribute('text')` and its child's would double every such string.
    const contents = [];
    for (const el of elementIterator(this)) {
      if (Array.isArray(el.childNodes) && el.childNodes.length > 0) continue;
      contents.push(el.getAttribute('text') || el.getAttribute('html'));
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
    // `tagName`'s own setter (below) always normalizes through `normalizeElementName` (strips
    // dashes, lowercases), so a stored element's `.tagName` is never the literal tag written in a
    // template (e.g. `<text-view>` reads back as `'textview'`, not `'text-view'`). Without
    // normalizing the search argument the same way, this comparison could never match anything
    // for a dashed or mixed-case tag name - which silently broke every `querySelector`/
    // `triggerEvent` call site (including inside `@ember/test-helpers` itself) that looked up an
    // element by its template tag name instead of an id/class.
    const normalizedTagName = normalizeElementName(tagName);
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.tagName === normalizedTagName) return el;
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
