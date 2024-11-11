declare module '*.scss';

type AnyFunction = (...args: any) => any;

// @ts-expect-error already defined, do not care
// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/prefer-namespace-keyword,@typescript-eslint/no-namespace
declare module globalThis {
  var define: AnyFunction;
  var requirejs: AnyFunction;
  var requireModule: AnyFunction;
  // @ts-expect-error ignore
  var Element: import('../dom/nodes/ElementNode.ts').default;
  // @ts-expect-error ignore
  var Node: import('../dom/nodes/ElementNode.ts').default;
  var __metadata: AnyFunction;
  var __decorate: AnyFunction;
  var __inspectorSendEvent: AnyFunction;
  var emberDebugInjected: boolean;
  // @ts-expect-error ignore
  var MessageChannel: MessageChannel;
  // @ts-expect-error ignore
  var postMessage: AnyFunction;
  var triggerEvent: AnyFunction;
  var EmberInspector: any;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Document {
  nodeMap: any;
}

declare module 'loader.js' {
  const require: AnyFunction;
  const define: AnyFunction;
}

type ViewBase = import('@nativescript/core').ViewBase;
type NativeElementNode<T extends ViewBase> =
  import('../dom/native/NativeElementNode').default<T>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface HTMLElementTagNameMap {
  'rad-list-view': NativeElementNode<
    import('nativescript-ui-listview').RadListView
  >;
  'list-view': NativeElementNode<import('@nativescript/core').ListView>;
  'html-view': NativeElementNode<import('@nativescript/core').HtmlView>;
}
