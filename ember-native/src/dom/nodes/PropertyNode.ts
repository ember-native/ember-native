import { normalizeElementName } from '../element-registry.ts';
import ElementNode from './ElementNode.ts';
import ViewNode from './ViewNode.ts';

export default class PropertyNode extends ElementNode {
  propertyName: string;
  propertyTagName: string;

  constructor(tagName: string, propertyName: string) {
    super(`${tagName}.${propertyName}`);
    this.propertyName = propertyName;
    this.propertyTagName = normalizeElementName(tagName);

    this.nodeType = 7; //processing instruction
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
    if (parent && parent.tagName === this.propertyTagName) {
      const el = this.firstElement();
      parent.setAttribute(this.propertyName, el);
    }
  }

  clearOnNode(parent: ViewNode) {
    if (parent && parent.tagName === this.propertyTagName) {
      parent.setAttribute(this.propertyName, null);
    }
  }
}
