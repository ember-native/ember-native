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

type AnyFunction = (...args: any) => any;

declare namespace globalThis {
  var define: AnyFunction;
  var requirejs: AnyFunction;
  var requireModule: AnyFunction;
  var Element: typeof import('../src/dom/nodes/ElementNode.ts').default;
  var Node: typeof import('../src/dom/nodes/ElementNode.ts').default;
  var __metadata: AnyFunction;
  var __decorate: AnyFunction;
  var __inspectorSendEvent: AnyFunction;
  var emberDebugInjected: boolean;
  var MessageChannel: MessageChannel;
  var postMessage: AnyFunction;
  var triggerEvent: AnyFunction;
  var EmberInspector: any;
}

interface Document {
  nodeMap: any;
}

declare module 'loader.js' {
  declare const require: AnyFunction;
  declare const define: AnyFunction;
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
