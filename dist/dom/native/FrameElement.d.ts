import { Frame } from '@nativescript/core/ui/frame';
import ViewNode from '../nodes/ViewNode';
import NativeElementNode from './NativeElementNode';
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
