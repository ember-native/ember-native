import { getViewMeta, normalizeElementName } from '../element-registry.ts';
import DocumentNode from './DocumentNode.ts';

function* elementIterator(el: any): Generator<any, void, unknown> {
  yield el;
  for (const child of el.childNodes) {
    yield* elementIterator(child);
  }
}

export type EventListener = (args: any) => void;

export default class ViewNode {
  attributes: any;
  args: any;
  template: any;

  nodeType: any;
  _tagName: any;
  declare parentNode: ViewNode | null;
  childNodes: ViewNode[];
  prevSibling: ViewNode | null;
  nextSibling: ViewNode | null;
  _ownerDocument: any;
  _meta: any;

  get textContent() {
    const contents = [];
    for (const el of elementIterator(this)) {
      contents.push(el.text || el.html);
    }
    return contents.filter((c) => !!c).join(' ');
  }

  getElementById(id: string) {
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.id === id) return el;
    }
  }

  getElementByClass(klass: string) {
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.classList.contains(klass)) return el;
    }
  }

  getElementByTagName(tagName: string) {
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.tagName === tagName) return el;
    }
  }

  querySelector(selector: string) {
    if (selector.startsWith('.')) {
      return this.getElementByClass(selector.slice(1));
    }

    if (selector.startsWith('#')) {
      return this.getElementById(selector.slice(1));
    }

    return this.getElementByTagName(selector);
  }

  contains(_otherElement: ViewNode) {
    return false;
  }

  constructor() {
    this.nodeType = null;
    this._tagName = null;
    this.parentNode = null;
    this.childNodes = [];
    this.prevSibling = null;
    this.nextSibling = null;

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

  get firstChild(): ViewNode | null | undefined {
    return this.childNodes.length ? this.childNodes[0] : null;
  }

  get lastChild(): ViewNode | null | undefined {
    return this.childNodes.length
      ? this.childNodes[this.childNodes.length - 1]
      : null;
  }

  get meta() {
    if (this._meta) {
      return this._meta;
    }

    return (this._meta = getViewMeta(this.tagName));
  }

  get isConnected(): boolean {
    return Boolean(this.ownerDocument);
  }

  /* istanbul ignore next */
  get ownerDocument(): DocumentNode | null {
    let el = this;
    while (el != null && el.nodeType !== 9) {
      el = el.parentNode || el._ownerDocument;
    }

    if (el?.nodeType === 9) {
      return el as unknown as DocumentNode;
    }

    return null;
  }

  getAttribute(key: string) {
    return this[key as keyof this];
  }

  /* istanbul ignore next */
  setAttribute(key: string, value: any) {
    this.attributes.push({
      nodeName: key,
      nodeValue: value,
    });

    this[key as keyof this] = value;
  }

  onInsertedChild(_childNode: ViewNode, _index: number) {}

  onRemovedChild(_childNode: ViewNode) {}

  insertBefore(childNode: ViewNode, referenceNode: ViewNode) {
    if (!childNode) {
      throw new Error(`Can't insert child.`);
    }

    // in some rare cases insertBefore is called with a null referenceNode
    // this makes sure that it get's appended as the last child
    if (!referenceNode) {
      return this.appendChild(childNode);
    }

    if (referenceNode.parentNode !== this) {
      throw new Error(
        `Can't insert child, because the reference node has a different parent.`,
      );
    }

    if (childNode.parentNode && childNode.parentNode !== this) {
      throw new Error(
        `Can't insert child, because it already has a different parent.`,
      );
    }

    if (childNode.parentNode === this) {
      // we don't need to throw an error here, because it is a valid case
      // for example when switching the order of elements in the tree
      // fixes #127 - see for more details
      // fixes #240
      // throw new Error(`Can't insert child, because it is already a child.`)
    }

    const index = this.childNodes.indexOf(referenceNode);

    childNode.nextSibling = referenceNode;
    childNode.prevSibling = this.childNodes[index - 1]!;
    this.childNodes[index - 1]!.nextSibling = childNode;
    referenceNode.prevSibling = childNode;
    this.childNodes.splice(index, 0, childNode);
    childNode.parentNode = this;

    this.onInsertedChild(childNode, index);
  }

  appendChild(childNode: ViewNode) {
    if (!childNode) {
      throw new Error(`Can't append null child.`);
    }

    if (childNode.parentNode && childNode.parentNode !== this) {
      throw new Error(
        `Can't append child, because it already has a different parent.`,
      );
    }

    if (childNode.parentNode === this) {
      // we don't need to throw an error here, because it is a valid case
      // for example when switching the order of elements in the tree
      // fixes #127 - see for more details
      // fixes #240
      // throw new Error(`Can't append child, because it is already a child.`)
    }

    if (this.lastChild) {
      childNode.prevSibling = this.lastChild;
      this.lastChild.nextSibling = childNode;
    }

    this.childNodes.push(childNode);
    childNode.parentNode = this;

    this.onInsertedChild(childNode, this.childNodes.length - 1);
  }

  removeChild(childNode: ViewNode) {
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

    if (childNode.prevSibling) {
      childNode.prevSibling.nextSibling = childNode.nextSibling;
    }

    if (childNode.nextSibling) {
      childNode.nextSibling.prevSibling = childNode.prevSibling;
    }

    // reset the prevSibling and nextSibling. If not, a keep-alived component will
    // still have a filled nextSibling attribute so vue will not
    // insert the node again to the parent. See #220
    // childNode.prevSibling = null;
    // childNode.nextSibling = null;

    this.childNodes = this.childNodes.filter((node) => node !== childNode);
    this.onRemovedChild(childNode);
  }

  clear(node: any) {
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

  getBoundingClientRect(): {
    left: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  } | null {
    return null;
  }
}
