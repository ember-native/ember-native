import { Page } from '@nativescript/core/ui/page';
import NativeElementNode from './NativeElementNode';
export default class PageElement extends NativeElementNode {
    constructor();
    get nativeView(): Page;
    set nativeView(view: Page);
}
