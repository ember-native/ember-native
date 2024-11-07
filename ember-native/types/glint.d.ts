import NativeElementNode from '../declarations/dom/native/NativeElementNode';
import '@glint/environment-ember-loose/-private/dsl/globals';
import ViewNode from '../declarations/dom/nodes/ViewNode';


declare module '@glint/environment-ember-loose/-private/dsl/globals' {
  type InElementKeyword = ComponentLike<{
    Args: {
      Positional: [element: NativeElementNode];
      Named: {
        insertBefore?: null | undefined;
      };
    };
    Blocks: {
      default: [];
    };
  }>;
  interface Keywords {
    'in-element': InElementKeyword
  }

}

declare module '@glint/environment-ember-template-imports/-private/dsl' {
  export declare function applyAttributes(element: NativeElementNode<any>, attrs: Record<string, any>): void;
  export declare function applySplattributes<
    SourceElement extends NativeElementNode<T extends ViewNode ? T : unknown>,
    TargetElement extends SourceElement
  >(source: SourceElement, target: TargetElement): void;

}
