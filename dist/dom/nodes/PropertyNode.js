
import ElementNode from './ElementNode.js';

class PropertyNode extends ElementNode {
  constructor(tagName) {
    super(tagName);
    this.nodeType = 7; //processing instruction
  }
  get propertyName() {
    return this.getAttribute('key');
  }
  onInsertedChild() {
    this.setOnNode(this.parentNode);
  }
  onRemovedChild() {
    this.setOnNode(this.parentNode);
  }

  /* istanbul ignore next */
  toString() {
    return `${this.constructor.name}(${this.tagName}, ${this.propertyName})`;
  }
  setOnNode(parent) {
    if (parent && this.propertyName) {
      const el = this.firstElement();
      parent.setAttribute(this.propertyName, el);
    }
  }
  clearOnNode(parent) {
    if (parent && this.propertyName) {
      parent.setAttribute(this.propertyName, null);
    }
  }
}

export { PropertyNode as default };
//# sourceMappingURL=PropertyNode.js.map
