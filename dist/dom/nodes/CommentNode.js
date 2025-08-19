
import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-ClPBvGFm.js';
import ElementNode from './ElementNode.js';

class CommentNode extends ElementNode {
  constructor(text) {
    super('comment');
    _defineProperty(this, "nodeType", void 0);
    _defineProperty(this, "text", void 0);
    this.nodeType = 8;
    this.text = text;
  }
}

export { CommentNode as default };
//# sourceMappingURL=CommentNode.js.map
