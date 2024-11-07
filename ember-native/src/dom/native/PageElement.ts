import { Page } from '@nativescript/core/ui/page';

import NativeElementNode from './NativeElementNode.ts';

export default class PageElement extends NativeElementNode {
    constructor() {
        super('page', Page, null);
    }

    get nativeView(): Page {
        return super.nativeView as Page;
    }

    set nativeView(view: Page) {
        super.nativeView = view;
    }
}
