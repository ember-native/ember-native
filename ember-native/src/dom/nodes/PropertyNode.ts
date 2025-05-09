import ElementNode from './ElementNode.ts';
import ViewNode from './ViewNode.ts';

export default class PropertyNode extends ElementNode {
  constructor(tagName: string) {
    super(tagName);
    this.nodeType = 7; //processing instruction
  }

  get propertyName() {
    return this.getAttribute('key') as string;
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

  setOnNode(parent: ViewNode | null) {
    if (parent && this.propertyName) {
      const el = this.firstElement();
      parent.setAttribute(this.propertyName, el);
    }
  }

  clearOnNode(parent: ViewNode) {
    if (parent && this.propertyName) {
      parent.setAttribute(this.propertyName, null);
    }
  }
}
