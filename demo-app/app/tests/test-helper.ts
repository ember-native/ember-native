/// <reference types="vite/client" />
import '@valor/nativescript-websockets';
import App from '../native/main';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';
import { runTestApp } from "@nativescript/unit-test-runner";
import { NativeBridge } from '@valor/nativescript-websockets/bridge.android';
import NativeElementNode from 'ember-native/dom/native/NativeElementNode';
import { Frame, Application, StackLayout } from '@nativescript/core';

// `require.context` is webpack-only. Under Vite, `@nativescript/vite`'s own
// `virtual:ns-bundler-context` (imported ahead of the app's main entry -
// see its `configuration/typescript.js`) already walks the whole `app/`
// directory - including `app/tests/**` - and registers every XML file it
// finds via `registerBundlerModules`, so this call would be both unsupported
// (`require` is a dummy stub there) and redundant.
if (typeof require !== 'undefined' && typeof (require as any).context === 'function') {
  const context = (require as any).context('./', true, /.*\.(xml)/);
  if (typeof (globalThis as any).registerBundlerModules === 'function') {
    (globalThis as any).registerBundlerModules(context);
  } else {
    (globalThis as any).registerWebpackModules(context);
  }
}

const onClosing = (NativeBridge as any).prototype.onClosing;
NativeBridge.prototype.onClosing = function (websocket, code, reason) {
  if (code === 1005) {
    code = 1000;
  }
  onClosing.call(this, websocket, code, reason);
}


async function setupTestContainer(rootElement: NativeElementNode) {
  Application.resetRootView({
    moduleName: 'test-root-view'
  });
  while (true) {
    const testingFrame = Frame.getFrameById('root-frame');
    if (!testingFrame) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    const testContentView: StackLayout = testingFrame.parentNode.parentNode.getViewById('ember-testing-content-view');
    if (!testContentView) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    testContentView.addChild(rootElement.nativeView as any);
    break
  }
}


setApplication(App);

runTestApp({
  runTests: async () => {
    console.log('test start');
    setup(QUnit.assert);
    globalThis.__emberNative.installGlobal();
    await setupTestContainer(App.rootElement as any);
    // Discover and (via side effect) run every `*-test.*` file under this
    // directory. `require.context` (webpack) vs. `import.meta.glob` (Vite,
    // its native equivalent) - see the top of this file for why both calls
    // can coexist here without either bundler choking on the other's syntax.
    if (typeof require !== 'undefined' && typeof (require as any).context === 'function') {
      const tests = (require as any).context(".", true, /-test\.(ts|gts|js|gjs)$/);
      tests.keys().map(tests);
    } else {
      import.meta.glob('./**/*-test.{ts,gts,js,gjs}', { eager: true });
    }


    start({
      startTests: false,
      setupTestContainer: false,
    })
  },
});
