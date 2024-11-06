declare module '*.scss';

declare global {
  // Prevents ESLint from "fixing" this via its auto-fix to turn it into a type
  // alias (e.g. after running any Ember CLI generator)
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  import { MutableArray } from '@ember/array';
  interface Array<T> extends MutableArray<T> {}
  // interface Function extends Ember.FunctionPrototypeExtensions {}

  var define: Function;
  namespace NodeJS {
    interface Global {

    }
  }
}


declare module globalThis {
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
}


interface Document {
  nodeMap: any;
}
