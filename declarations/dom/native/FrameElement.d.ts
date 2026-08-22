import { Frame } from '@nativescript/core/ui/frame';
import type { NavigationTransition } from '@nativescript/core';
import ViewNode from '../nodes/ViewNode.ts';
import NativeElementNode from './NativeElementNode.ts';
export declare function setNextTransition(transition?: NavigationTransition, animated?: boolean): void;
export default class FrameElement extends NativeElementNode {
    currentPage: any;
    constructor();
    setAttribute(key: string, value: any): void;
    get nativeView(): Frame;
    set nativeView(view: Frame);
    appendChild(childNode: ViewNode): void;
    onInsertedChild(childNode: ViewNode): void;
    removeChild(childNode: NativeElementNode): void;
}
