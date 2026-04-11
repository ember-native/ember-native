import ViewNode from './ViewNode.ts';
export default class TextNode extends ViewNode {
    text: any;
    private _parentNode;
    constructor(text: string);
    set parentNode(node: ViewNode | null);
    get parentNode(): ViewNode | null;
    setText(text: string): void;
    get nodeValue(): string;
    set nodeValue(value: string);
}
