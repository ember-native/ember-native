import CommentNode from './CommentNode.ts';
import ElementNode from './ElementNode.ts';
import PropertyNode from './PropertyNode.ts';
import TextNode from './TextNode.ts';
import ViewNode from './ViewNode.ts';
import type { NativeElementsTagNameMap } from '../native-elements-tag-name-map.ts';
import type PageElement from '../native/PageElement.ts';
import NativeElementNode from '../native/NativeElementNode.ts';
export default class DocumentNode extends ViewNode {
    head: any;
    config: any;
    nodeMap: Map<any, any>;
    page: PageElement | undefined;
    body: ElementNode | undefined;
    documentElement: {
        dataset: {};
    };
    static getInstance(): DocumentNode;
    constructor();
    createComment(text: string): CommentNode;
    static createPropertyNode(tagName: string, propertyName: string): PropertyNode;
    createElement(name: string): any;
    static createElement<T extends keyof NativeElementsTagNameMap>(tagName: T): NativeElementsTagNameMap[T];
    createElementNS(_namespace: any, tagName: keyof NativeElementsTagNameMap): PageElement | NativeElementNode<import("@nativescript/core").ListView> | NativeElementNode<import("@nativescript/core").StackLayout> | NativeElementNode<null>;
    createTextNode(text: string): TextNode;
    addEventListener(event: string, callback: EventListener): void;
    removeEventListener(event: string, handler: EventListener): void;
    searchDom(node: ViewNode, startNode: ViewNode, endNode: ViewNode): boolean;
    createRange(): {
        startNode: ViewNode | null;
        endNode: ViewNode | null;
        setStartBefore(startNode: ViewNode | null): void;
        setEndAfter(endNode: ViewNode | null): void;
        isPointInRange(dom: ViewNode): boolean;
        getBoundingClientRect(): {
            left: any;
            top: any;
            bottom: any;
            width: any;
            height: any;
        } | null;
    };
    querySelectorAll(selector: string): {
        getAttribute(): string;
    } | undefined;
}
//# sourceMappingURL=DocumentNode.d.ts.map