import ViewNode from './ViewNode.ts';
export interface IClassList {
    length: number;
    add(...classNames: string[]): void;
    remove(...classNames: string[]): void;
    contains(className: string): boolean;
}
export default class ElementNode extends ViewNode {
    _classList: IClassList;
    constructor(tagName: string);
    get id(): string;
    set id(value: string);
    get classList(): IClassList;
    appendChild(childNode: ViewNode): void;
    insertBefore(childNode: ViewNode, referenceNode: ViewNode): void;
    removeChild(childNode: ViewNode): void;
}
//# sourceMappingURL=ElementNode.d.ts.map