import '@valor/nativescript-websockets';
import App from '../native/main';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';
import { runTestApp } from "@nativescript/unit-test-runner";
import { NativeBridge } from '@valor/nativescript-websockets/bridge.android';
import NativeElementNode from 'ember-native/dom/native/NativeElementNode';
import { Frame, Application, StackLayout } from '@nativescript/core';

const context = (require as any).context('./', true, /.*\.(xml)/);
globalThis.registerWebpackModules(context);

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
    const tests = (require as any).context(".", true, /-test\.(ts|gts|js|gjs)$/);
    tests.keys().map(tests);


    start({
      startTests: false,
      setupTestContainer: false,
    })
  },
});



