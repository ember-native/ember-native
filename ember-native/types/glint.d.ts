import NativeElementNode from '../declarations/dom/native/NativeElementNode';
import '@glint/environment-ember-loose/-private/dsl/globals';
import { Globals as EMLGlobals } from '@glint/environment-ember-template-imports/-private/dsl/globals';
import ViewNode from '../declarations/dom/nodes/ViewNode';
import type { ComponentLike } from '@glint/template';

declare module '@glint/environment-ember-template-imports/-private/dsl' {
  export declare function applyAttributes(
    element: NativeElementNode<any>,
    attrs: Record<string, any>,
  ): void;
  export declare function applySplattributes<
    SourceElement extends NativeElementNode<T extends ViewNode ? T : never>,
    TargetElement extends SourceElement,
  >(source: SourceElement, target: TargetElement): void;
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
  export interface Globals {
    'in-element': InElementKeyword;
  }
  export declare const Globals: Globals & EMLGlobals;
}
