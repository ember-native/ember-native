import ViewNode from './ViewNode';
export default class TextNode extends ViewNode {
    text: any;
    private _parentNode;
    constructor(text: any);
    set parentNode(node: any);
    get parentNode(): any;
    setText(text: any): void;
}
