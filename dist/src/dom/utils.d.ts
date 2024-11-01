import { ContentView } from '@nativescript/core/ui/content-view';
import { View } from '@nativescript/core/ui/core/view';
import { LayoutBase } from '@nativescript/core/ui/layouts/layout-base';
export declare function isView(view: any): view is View;
export declare function isLayout(view: any): view is LayoutBase;
export declare function isContentView(view: any): view is ContentView;
