import { type EventData, View } from '@nativescript/core';
import { type ViewBase } from '@nativescript/core/ui/core/view-base';
import ElementNode from '../nodes/ElementNode.ts';
import ViewNode, { type EventListener } from '../nodes/ViewNode.ts';
export interface ComponentMeta {
    skipAddToDom?: boolean;
    insertChild?: (parent: NativeElementNode<any>, child: NativeElementNode<any>, index: number) => void;
    removeChild?: (parent: NativeElementNode, child: NativeElementNode) => void;
}
export default class NativeElementNode<T extends ViewBase | null = ViewBase> extends ElementNode {
    _nativeView: T;
    _meta: ComponentMeta;
    constructor(tagName: string, viewClass: typeof View | null, meta?: ComponentMeta | null);
    setStyle(property: string, value: string | number | null): void;
    get style(): import("@nativescript/core").Style;
    set style(v: import("@nativescript/core").Style);
    updateText(): void;
    get nativeView(): T;
    set nativeView(view: T);
    get meta(): ComponentMeta;
    addEventListener(event: string, handler: EventListener): void;
    removeEventListener(event: string, handler?: EventListener): void;
    getAttribute(fullkey: string): any;
    onInsertedChild(childNode: ViewNode, atIndex: number): any;
    onRemovedChild(childNode: ViewNode): void;
    setAttribute(fullkey: string, value: any): void;
    dispatchEvent(event: EventData): void;
    clear(node: any): void;
    appendChild(childNode: ViewNode): void;
    insertBefore(childNode: ViewNode, referenceNode: ViewNode): void;
    removeChild(childNode: ViewNode): void;
    removeChildren(): void;
    getBoundingClientRect(): {
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
    } | {
        left: number;
        top: number;
        bottom: number;
        width: number;
        height: number;
        right?: undefined;
    };
}
