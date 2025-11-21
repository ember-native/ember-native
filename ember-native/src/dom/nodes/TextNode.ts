import { TextBase } from '@nativescript/core';
import ViewNode from './ViewNode.ts';
import NativeElementNode from '../native/NativeElementNode.ts';

export default class TextNode extends ViewNode {
  text: any;
  private _parentNode: ViewNode | null = null;
  constructor(text: string) {
    super();

    this.nodeType = 3;
    this.text = text;

    this._meta = {
      skipAddToDom: true,
    };
  }

  // @ts-expect-error override parent
  set parentNode(node: ViewNode | null) {
    this._parentNode = node;
    this.setText(this.text);
  }

  get parentNode() {
    return this._parentNode;
  }

  setText(text: string) {
    this.text = text;
    if (
      this.parentNode instanceof NativeElementNode &&
      this.parentNode?.nativeView instanceof TextBase
    ) {
      this.parentNode.updateText();
    }
  }

  get nodeValue() {
    return this.text;
  }

  set nodeValue(value: string) {
    this.setText(value);
  }
}
