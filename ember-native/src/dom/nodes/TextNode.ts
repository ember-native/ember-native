import {Label} from '@nativescript/core';
import ViewNode from './ViewNode';

export default class TextNode extends ViewNode {
    text: any;
    private _parentNode: any;

    constructor(text) {
        super();

        this.nodeType = 3;
        this.text = text;

        this._meta = {
            skipAddToDom: true
        };
    }

    set parentNode(node) {
        this._parentNode = node;
        this.setText(this.text);
    }

    get parentNode() {
        return this._parentNode;
    }

    setText(text) {
        this.text = text;
        if (this.parentNode?.nativeView instanceof Label) {
            this.parentNode.updateText();
        }
    }
}
