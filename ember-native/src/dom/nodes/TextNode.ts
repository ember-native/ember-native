import { Label, TextBase } from '@nativescript/core';
import ViewNode from './ViewNode';

export default class TextNode extends ViewNode {
    text: any;
    private _parentNode: ViewNode | null = null;
    constructor(text: string) {
        super();

        this.nodeType = 3;
        this.text = text;

        this._meta = {
            skipAddToDom: true
        };
    }

    // @ts-ignore
  set parentNode(node: ViewNode | null) {
      this._parentNode = node;
      this.setText(this.text);
    }

    get parentNode() {
      return this._parentNode;
    }

    setText(text: string) {
        this.text = text;
        if (this.parentNode?.nativeView instanceof TextBase) {
          this.parentNode.updateText();
        }
    }
}
