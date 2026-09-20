import Component from '@glimmer/component';
import type { ListView as NativeListView, StackLayout, ItemEventData, EventData } from '@nativescript/core';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
interface ListViewInterface<T> {
    Element: NativeElementNode<NativeListView>;
    Args: {
        items: T[];
        key?: string;
        onItemTap?: (args: ItemEventData) => void;
        onItemLoading?: (args: ItemEventData) => void;
        onLoadMoreItems?: (args: EventData) => void;
        onSearchChange?: (args: EventData) => void;
        sectioned?: boolean;
        stickyHeader?: boolean;
        stickyHeaderHeight?: number;
        stickyHeaderTopPadding?: boolean | number;
        showSearch?: boolean;
        searchAutoHide?: boolean;
        separatorColor?: string;
        rowHeight?: number;
        iosEstimatedRowHeight?: number;
    };
    Blocks: {
        item: [T | null];
        publicApi: [
            {
                refresh: () => void;
                scrollToIndex: (index: number) => void;
                scrollToIndexAnimated: (index: number) => void;
                isItemAtIndexVisible: (index: number) => boolean;
            }
        ];
    };
}
export default class ListView<T> extends Component<ListViewInterface<T>> {
    private elementRefs;
    private elementsByNativeView;
    private listViewElement?;
    get items(): {
        element: NativeElementNode<StackLayout>;
        readonly inRange: boolean;
        readonly item: T | null;
    }[];
    get itemKey(): string;
    refresh(): void;
    scrollToIndex(index: number): void;
    scrollToIndexAnimated(index: number): void;
    isItemAtIndexVisible(index: number): boolean;
    get publicApi(): {
        refresh: () => void;
        scrollToIndex: (index: number) => void;
        scrollToIndexAnimated: (index: number) => void;
        isItemAtIndexVisible: (index: number) => boolean;
    };
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
