declare module '*.scss';

declare module 'ember-modifier' {
  import ViewNode from '../declarations/dom/nodes/ViewNode';
  import type {
    ElementFor,
    EmptyObject,
    NamedArgs,
    PositionalArgs,
  } from 'ember-modifier/-private/signature.ts';
  import type { Teardown } from 'ember-modifier/-private/function-based/modifier';
  export function modifier<
    E extends ViewNode,
    P extends unknown[],
    N = EmptyObject,
  >(
    fn: (element: E, positional: P, named: N) => void | Teardown,
  ): FunctionBasedModifier<{
    Args: {
      Positional: P;
      Named: N;
    };
    Element: E;
  }>;
  export function modifier<S>(
    fn: (
      element: ElementFor<S>,
      positional: PositionalArgs<S>,
      named: NamedArgs<S>,
    ) => void | Teardown,
  ): FunctionBasedModifier<{
    Element: ElementFor<S>;
    Args: {
      Named: NamedArgs<S>;
      Positional: PositionalArgs<S>;
    };
  }>;
}

declare namespace globalThis {
  var define: Function;
  var requirejs: Function;
  var requireModule: Function;
  var Element: typeof import('../src/dom/nodes/ElementNode.ts').default;
  var Node: typeof import('../src/dom/nodes/ElementNode.ts').default;
  var __metadata: Function;
  var __decorate: Function;
  var __inspectorSendEvent: Function;
  var emberDebugInjected: boolean;
  var MessageChannel: MessageChannel;
  var postMessage: Function;
  var triggerEvent: Function;
  var EmberInspector: any;
}

interface Document {
  nodeMap: any;
}

declare module 'loader.js' {
  declare const require: Function;
  declare const define: Function;
}

declare namespace globalThis {
  import NativeElementNode from '../src/dom/native/NativeElementNode';
  import { RadListView as NativeRadListView } from 'nativescript-ui-listview';
  import { ListView } from '@nativescript/core';
  interface HTMLElementTagNameMap {
    'rad-list-view': NativeElementNode<NativeRadListView>;
    'list-view': NativeElementNode<ListView>;
  }
}
