import ViewNode from './ViewNode.ts';
export interface IClassList {
    length: number;
    add(...classNames: string[]): void;
    remove(...classNames: string[]): void;
    contains(className: string): boolean;
}
export default class ElementNode extends ViewNode {
    _classList: IClassList;
    _id: string;
    static ELEMENT_NODE: number;
    static ATTRIBUTE_NODE: number;
    static TEXT_NODE: number;
    static DOCUMENT_NODE: number;
    constructor(tagName: string);
    get id(): string;
    set id(v: string);
    get classList(): IClassList;
    appendChild(childNode: ViewNode): void;
    insertBefore(childNode: ViewNode, referenceNode: ViewNode): void;
    removeChild(childNode: ViewNode): void;
}
