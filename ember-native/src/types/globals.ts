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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface HTMLElementTagNameMap {
  'rad-list-view': import('../dom/native/NativeElementNode').default<
    import('nativescript-ui-listview').RadListView
  >;
  'list-view': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').ListView
  >;
  'html-view': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').HtmlView
  >;
  'scroll-view': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').ScrollView
  >;
  'text-field': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').TextField
  >;
  'text-view': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').TextView
  >;
  'web-view': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').WebView
  >;
  'content-view': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').ContentView
  >;
  'tab-view': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').TabView
  >;
  'tab-view-item': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').TabViewItem
  >;
  switch: import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').Switch
  >;
  'formatted-string': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').FormattedString
  >;
  frame: import('../dom/native/FrameElement.ts').default;
  page: import('../dom/native/PageElement.ts').default;
  // @ts-expect-error just override
  span: import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').Span
  >;
  'action-bar': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').ActionBar
  >;
  'action-item': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').ActionItem
  >;
  comment: import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').Placeholder
  >;
  // @ts-expect-error just override
  button: import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').Button
  >;
  'navigation-button': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').NavigationButton
  >;
  image: import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').Image
  >;
  // @ts-expect-error just override
  label: import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').Label
  >;
  'list-picker': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').ListPicker
  >;
  'date-picker': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').DatePicker
  >;
  'dock-layout': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').DockLayout
  >;
  'wrap-layout': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').WrapLayout
  >;
  'stack-layout': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').StackLayout
  >;
  'grid-layout': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').GridLayout
  >;
  'flexbox-layout': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').FlexboxLayout
  >;
  'absolute-layout': import('../dom/native/NativeElementNode').default<
    import('@nativescript/core').AbsoluteLayout
  >;
}
