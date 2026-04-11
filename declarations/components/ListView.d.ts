import Component from '@glimmer/component';
import type { ListView as NativeListView } from '@nativescript/core';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
interface ListViewInterface<T> {
    Element: NativeElementNode<NativeListView>;
    Args: {
        items: T[];
        key?: string;
    };
    Blocks: {
        item: [T | null];
    };
}
type Ref<T> = {
    index: number;
    item: T | null;
    element: NativeElementNode<any>;
};
export default class ListView<T> extends Component<ListViewInterface<T>> {
    elementRefs: Ref<T>[];
    get items(): Ref<T>[];
    get itemKey(): string;
    cleanup(listView: NativeElementNode<NativeListView>): void;
    setupListView: import("ember-modifier").FunctionBasedModifier<{
        Args: {
            Positional: [];
            Named: import("ember-modifier/-private/signature").EmptyObject;
        };
        Element: NativeElementNode<NativeListView>;
    }>;
}
export {};
