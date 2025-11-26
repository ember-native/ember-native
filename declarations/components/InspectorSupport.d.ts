import Component from '@glimmer/component';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
import DocumentNode from '../dom/nodes/DocumentNode.ts';
import type PageElement from '../dom/native/PageElement.ts';
interface InspectorSupportInterface {
    Blocks: {
        default: [];
    };
}
export default class InspectorSupport extends Component<InspectorSupportInterface> {
    highlight: NativeElementNode;
    tooltip: NativeElementNode;
    page: PageElement;
    ownerDocument: DocumentNode;
    setupInspector: () => void;
    setupHighlight: import("ember-modifier").FunctionBasedModifier<{
        Args: {
            Positional: [];
            Named: import("ember-modifier/-private/signature").EmptyObject;
        };
        Element: NativeElementNode<import("@nativescript/core").ViewBase>;
    }>;
    setupTooltip: import("ember-modifier").FunctionBasedModifier<{
        Args: {
            Positional: [];
            Named: import("ember-modifier/-private/signature").EmptyObject;
        };
        Element: NativeElementNode<import("@nativescript/core").ViewBase>;
    }>;
}
export {};
