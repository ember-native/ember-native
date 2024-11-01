import CommentNode from './CommentNode';
import ElementNode from './ElementNode';
import PropertyNode from './PropertyNode';
import TextNode from './TextNode';
import ViewNode from './ViewNode';
export default class DocumentNode extends ViewNode {
    head: any;
    nodeMap: Map<any, any>;
    page: ElementNode;
    body: ElementNode;
    documentElement: {
        dataset: {};
    };
    constructor();
    createComment(text: any): CommentNode;
    createPropertyNode(tagName: string, propertyName: string): PropertyNode;
    createElement(tagName: any): ElementNode;
    createElementNS(namespace: any, tagName: any): ElementNode;
    createTextNode(text: any): TextNode;
    addEventListener(event: any, callback: any): void;
    removeEventListener(event: any, handler: any): void;
    searchDom(node: any, startNode: any, endNode: any): boolean;
    createRange(): {
        startNode: ViewNode | null;
        endNode: ViewNode | null;
        setStartBefore(startNode: any): void;
        setEndAfter(endNode: any): void;
        isPointInRange(dom: any, number: any): boolean;
        getBoundingClientRect(): {
            left: any;
            top: any;
            bottom: any;
            width: any;
            height: any;
        };
    };
    querySelectorAll(selector: any): {
        getAttribute(): string;
    };
}
