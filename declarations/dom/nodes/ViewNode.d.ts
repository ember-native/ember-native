import DocumentNode from './DocumentNode.ts';
export type EventListener = (args: any) => void;
export default class ViewNode {
    attributes: any;
    args: any;
    template: any;
    nodeType: any;
    _tagName: any;
    parentNode: ViewNode | null;
    childNodes: ViewNode[];
    prevSibling: ViewNode | null;
    nextSibling: ViewNode | null;
    _ownerDocument: any;
    _meta: any;
    getElementById(id: string): any;
    getElementByClass(klass: string): any;
    getElementByTagName(tagName: string): any;
    querySelector(selector: string): any;
    contains(_otherElement: ViewNode): boolean;
    constructor();
    hasAttribute(): boolean;
    removeAttribute(): boolean;
    toString(): string;
    set tagName(name: any);
    get tagName(): any;
    get firstChild(): ViewNode | null | undefined;
    get lastChild(): ViewNode | null | undefined;
    get meta(): any;
    get isConnected(): boolean;
    get ownerDocument(): DocumentNode | null;
    getAttribute(key: string): this[keyof this];
    setAttribute(key: string, value: any): void;
    onInsertedChild(_childNode: ViewNode, _index: number): void;
    onRemovedChild(_childNode: ViewNode): void;
    insertBefore(childNode: ViewNode, referenceNode: ViewNode): void;
    appendChild(childNode: ViewNode): void;
    removeChild(childNode: ViewNode): void;
    clear(node: any): void;
    removeChildren(): void;
    firstElement(): ViewNode | null;
    getBoundingClientRect(): {
        left: number;
        top: number;
        bottom: number;
        width: number;
        height: number;
    } | null;
}
//# sourceMappingURL=ViewNode.d.ts.map