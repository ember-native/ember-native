import Component from '@glimmer/component';
import { RadListView as NativeRadListView } from 'nativescript-ui-listview';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
import TrackedMap from './tracked-map.ts';
import type { StackLayout } from '@nativescript/core';
interface RadListViewInterface<T> {
    Element: NativeElementNode<NativeRadListView>;
    Args: {
        items: T[];
        key?: string;
    };
    Blocks: {
        header: [];
        footer: [];
        item: [T];
    };
}
export default class RadListView<T = any> extends Component<RadListViewInterface<T>> {
    elementRefs: TrackedMap<NativeElementNode<StackLayout>, T>;
    private listView;
    private headerElement;
    private footerElement;
    cleanup(listView: NativeElementNode<NativeRadListView>): void;
    get itemKey(): string;
    get items(): {
        element: NativeElementNode<StackLayout>;
        readonly item: T;
    }[];
    setupListView: import("ember-modifier").FunctionBasedModifier<{
        Args: {
            Positional: [];
            Named: import("ember-modifier/-private/signature").EmptyObject;
        };
        Element: NativeElementNode<NativeRadListView>;
    }>;
    setupHeader: () => void;
    setupFooter: () => void;
}
export {};
