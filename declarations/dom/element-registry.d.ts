import type { NativeElementsTagNameMap } from './native-elements-tag-name-map.ts';
import type NativeElementNode from './native/NativeElementNode.ts';
export declare function normalizeElementName(elementName: string): string;
export declare function registerElement(elementName: string, resolver: () => NativeElementNode, meta?: object | null): void;
export declare function getElementMap(): Record<string, any>;
export declare function getViewClass(elementName: string): any;
export declare function getViewMeta(elementName: string): {
    skipAddToDom: boolean;
    isUnaryTag: boolean;
    tagNamespace: string;
    canBeLeftOpenTag: boolean;
    component: any;
};
export declare function isKnownView(elementName: string): any;
export declare function createElement<T extends keyof NativeElementsTagNameMap>(elementName: T): NativeElementsTagNameMap[T];
