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
    createEvent(eventInterface: string): {
        eventInterface: string;
        initEvent(type: string, bubbles: boolean, cancelable: boolean): void;
    };
    createComment(text: string): CommentNode;
    static createPropertyNode(tagName: string): PropertyNode;
    createElement(name: string): any;
    static createElement<T extends keyof NativeElementsTagNameMap>(tagName: T): NativeElementsTagNameMap[T];
    createElementNS(_namespace: any, tagName: keyof NativeElementsTagNameMap): PageElement | NativeElementNode<import("@nativescript/core").Placeholder> | NativeElementNode<null> | NativeElementNode<import("nativescript-ui-listview").RadListView> | NativeElementNode<import("@nativescript/core").ListView> | NativeElementNode<import("@nativescript/core").HtmlView> | NativeElementNode<import("@nativescript/core").ScrollView> | NativeElementNode<import("@nativescript/core").TextField> | NativeElementNode<import("@nativescript/core").TextView> | NativeElementNode<import("@nativescript/core").WebView> | NativeElementNode<import("@nativescript/core").ContentView> | NativeElementNode<import("@nativescript/core").TabView> | NativeElementNode<import("@nativescript/core").TabViewItem> | NativeElementNode<import("@nativescript/core").Switch> | NativeElementNode<import("@nativescript/core").FormattedString> | import("../native/FrameElement.ts").default | NativeElementNode<import("@nativescript/core").Span> | NativeElementNode<import("@nativescript/core").ActionBar> | NativeElementNode<import("@nativescript/core").ActionItem> | NativeElementNode<import("@nativescript/core").Button> | NativeElementNode<import("@nativescript/core").NavigationButton> | NativeElementNode<import("@nativescript/core").Image> | NativeElementNode<import("@nativescript/core").Label> | NativeElementNode<import("@nativescript/core").ListPicker> | NativeElementNode<import("@nativescript/core").DatePicker> | NativeElementNode<import("@nativescript/core").DockLayout> | NativeElementNode<import("@nativescript/core").WrapLayout> | NativeElementNode<import("@nativescript/core").StackLayout> | NativeElementNode<import("@nativescript/core").GridLayout> | NativeElementNode<import("@nativescript/core").FlexboxLayout> | NativeElementNode<import("@nativescript/core").AbsoluteLayout>;
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
        };
    };
    querySelectorAll(selector: string): {
        getAttribute(): string;
    };
}
