import NativeElementNode from '../dom/native/NativeElementNode';
import '@glint/environment-ember-template-imports/globals';
import '@glint/template/-private/dsl/emit';
import type { ComponentLike } from '@glint/template';
import type { ViewBase } from '@nativescript/core';

declare module '@glint/environment-ember-template-imports/globals' {
  type InElementKeyword = ComponentLike<{
    Args: {
      Positional: [element: NativeElementNode<any>];
      Named: {
        insertBefore?: null | undefined;
      };
    };
    Blocks: {
      default: [];
    };
  }>;
  export default interface Globals {
    'in-element': InElementKeyword;
  }
}

declare module '@glint/template/-private/dsl/emit' {

  export function applyAttributes(
    element: NativeElementNode<any>,
    attrs: Record<string, any>,
  ): void;
  export function applySplattributes<
    T,
    SourceElement extends NativeElementNode<T extends ViewBase ? T : never>,
    TargetElement extends SourceElement,
  >(source: SourceElement, target: TargetElement): void;
}
