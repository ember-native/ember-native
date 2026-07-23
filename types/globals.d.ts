declare module '*.scss';

type AnyFunction = (...args: any) => any;

// Add global functions
declare global {
  const __inspectorSendEvent: AnyFunction;
  const __decorate: AnyFunction;
  const __metadata: AnyFunction;
}

declare namespace globalThis {
  const __inspectorSendEvent: AnyFunction;
  const __decorate: AnyFunction;
  const __metadata: AnyFunction;
}

// Add properties to globalThis
interface Window {
  define: AnyFunction;
  requirejs: AnyFunction;
  requireModule: AnyFunction;
  Element: any;
  Node: any;
  __metadata: AnyFunction;
  __decorate: AnyFunction;
  __inspectorSendEvent: AnyFunction;
  emberDebugInjected: boolean;
  MessageChannel: MessageChannel;
  postMessage: AnyFunction;
  triggerEvent: AnyFunction;
  EmberInspector: any;
}

interface Document {
  nodeMap: any;
}

declare module 'loader.js' {
  const require: AnyFunction;
  const define: AnyFunction;
}
