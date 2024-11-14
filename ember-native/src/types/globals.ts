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
  'scroll-view': NativeElementNode<import('@nativescript/core').ScrollView>;
  'text-field': NativeElementNode<import('@nativescript/core').TextField>;
  'text-view': NativeElementNode<import('@nativescript/core').TextView>;
  'web-view': NativeElementNode<import('@nativescript/core').WebView>;
  'content-view': NativeElementNode<import('@nativescript/core').ContentView>;
  'tab-view': NativeElementNode<import('@nativescript/core').TabView>;
  'tab-view-item': NativeElementNode<import('@nativescript/core').TabViewItem>;
  switch: NativeElementNode<import('@nativescript/core').Switch>;
  'formatted-string': NativeElementNode<
    import('@nativescript/core').FormattedString
  >;
  frame: import('../dom/native/FrameElement.ts').default;
  page: import('../dom/native/PageElement.ts').default;
  // @ts-expect-error just override
  span: NativeElementNode<import('@nativescript/core').Span>;
  'action-bar': NativeElementNode<import('@nativescript/core').ActionBar>;
  'action-item': NativeElementNode<import('@nativescript/core').ActionItem>;
  comment: NativeElementNode<import('@nativescript/core').Placeholder>;
  // @ts-expect-error just override
  button: NativeElementNode<import('@nativescript/core').Button>;
  'navigation-button': NativeElementNode<
    import('@nativescript/core').NavigationButton
  >;
  image: NativeElementNode<import('@nativescript/core').Image>;
  // @ts-expect-error just override
  label: NativeElementNode<import('@nativescript/core').Label>;
  'list-picker': NativeElementNode<import('@nativescript/core').ListPicker>;
  'date-picker': NativeElementNode<import('@nativescript/core').DatePicker>;
  'dock-layout': NativeElementNode<import('@nativescript/core').DockLayout>;
  'wrap-layout': NativeElementNode<import('@nativescript/core').WrapLayout>;
  'stack-layout': NativeElementNode<import('@nativescript/core').StackLayout>;
  'grid-layout': NativeElementNode<import('@nativescript/core').GridLayout>;
  'flexbox-layout': NativeElementNode<
    import('@nativescript/core').FlexboxLayout
  >;
  'absolute-layout': NativeElementNode<
    import('@nativescript/core').AbsoluteLayout
  >;
}
