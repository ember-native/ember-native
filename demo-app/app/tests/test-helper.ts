/// <reference types="vite/client" />
import '@valor/nativescript-websockets';
import App from '../native/main';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';
import { runTestApp } from '@nativescript/unit-test-runner';
import { NativeBridge } from '@valor/nativescript-websockets/bridge.android';
import NativeElementNode from 'ember-native/dom/native/NativeElementNode';
import { Frame, Application, StackLayout } from '@nativescript/core';

// Registers `test-root-view.xml` under its bare name, which
// `setupTestContainer()` below looks up, using whichever bundler-provided
// module-discovery API (`require.context` or `import.meta.glob`) is
// available.
if (typeof require !== 'undefined' && typeof (require as any).context === 'function') {
  const context = (require as any).context('./', true, /.*\.(xml)/);
  if (typeof (globalThis as any).registerBundlerModules === 'function') {
    (globalThis as any).registerBundlerModules(context);
  } else {
    (globalThis as any).registerWebpackModules(context);
  }
} else {
  const xmlModules = import.meta.glob('./test-root-view.xml', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
  const testRootViewXml = xmlModules['./test-root-view.xml'];
  (globalThis as any).registerModule('test-root-view.xml', () => testRootViewXml);
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
    // Discover and run every `*-test.*` file under this directory, lazily -
    // tests must only be imported once this callback runs (after karma's
    // adapter has attached), not eagerly at module load time.
    if (typeof require !== 'undefined' && typeof (require as any).context === 'function') {
      const tests = (require as any).context(".", true, /-test\.(ts|gts|js|gjs)$/);
      tests.keys().map(tests);
    } else {
      const testModules = import.meta.glob('./**/*-test.{ts,gts,js,gjs}');
      const keys = Object.keys(testModules);
      for (const key of keys) {
        await testModules[key]();
      }
    }


    start({
      startTests: false,
      setupTestContainer: false,
    })
  },
});
