import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-DZQzmiRH.js';
import { normalizeElementName } from '../element-registry.js';
import ElementNode from './ElementNode.js';

class PropertyNode extends ElementNode {
  constructor(tagName, propertyName) {
    super(`${tagName}.${propertyName}`);
    _defineProperty(this, "propertyName", void 0);
    _defineProperty(this, "propertyTagName", void 0);
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
  setOnNode(parent) {
    if (parent && parent.tagName === this.propertyTagName) {
      const el = this.firstElement();
      parent.setAttribute(this.propertyName, el);
    }
  }
  clearOnNode(parent) {
    if (parent && parent.tagName === this.propertyTagName) {
      parent.setAttribute(this.propertyName, null);
    }
  }
}

export { PropertyNode as default };
//# sourceMappingURL=PropertyNode.js.map
