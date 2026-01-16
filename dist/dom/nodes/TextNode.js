
import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-ClPBvGFm.js';
import { TextBase } from '@nativescript/core';
import ViewNode from './ViewNode.js';
import NativeElementNode from '../native/NativeElementNode.js';

class TextNode extends ViewNode {
  constructor(text) {
    super();
    _defineProperty(this, "text", void 0);
    _defineProperty(this, "_parentNode", null);
    this.nodeType = 3;
    this.text = text;
    this._meta = {
      skipAddToDom: true
    };
  }

  // @ts-expect-error override parent
  set parentNode(node) {
    this._parentNode = node;
    this.setText(this.text);
  }
  get parentNode() {
    return this._parentNode;
  }
  setText(text) {
    this.text = text;
    if (this.parentNode instanceof NativeElementNode && this.parentNode?.nativeView instanceof TextBase) {
      this.parentNode.updateText();
    }
  }
  get nodeValue() {
    return this.text;
  }
  set nodeValue(value) {
    this.setText(value);
  }
}

export { TextNode as default };
//# sourceMappingURL=TextNode.js.map
