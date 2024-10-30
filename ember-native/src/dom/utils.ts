import {ContentView} from '@nativescript/core/ui/content-view';
import {View} from '@nativescript/core/ui/core/view';
import {LayoutBase} from '@nativescript/core/ui/layouts/layout-base';

export function isView(view) {
    return view instanceof View;
}

export function isLayout(view) {
    return view instanceof LayoutBase;
}

export function isContentView(view) {
    return view instanceof ContentView;
}
