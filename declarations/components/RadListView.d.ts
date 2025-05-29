import Component from '@glimmer/component';
import { RadListView as NativeRadListView } from 'nativescript-ui-listview';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
declare class TrackedMap extends Map<any, any> {
    counter: number;
    set(key: any, value: any): this;
    get(key: any): any;
    entries(): any;
}
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
    elementRefs: TrackedMap;
    private listView;
    private headerElement;
    private footerElement;
    cleanup(listView: NativeElementNode<NativeRadListView>): void;
    get itemKey(): string;
    get items(): {
        item: any;
        element: any;
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
