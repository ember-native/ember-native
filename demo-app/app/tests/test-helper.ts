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

// `require.context` is webpack-only, scoped here to this directory
// (`app/tests/`) - its module names come out relative to *that* root, so
// `./test-root-view.xml` registers as the bare nickname `test-root-view`,
// which is what `setupTestContainer()` below looks up.
//
// Under Vite, `@nativescript/vite`'s own `virtual:ns-bundler-context` also
// walks and registers every XML file, but rooted at the whole `app/`
// directory instead - `registerBundlerModules`'s own nickname logic only
// strips a leading `./` for non-`.js` files (see its `moduleNickNames`
// branch), so `app/tests/test-root-view.xml` only ever gets registered as
// `tests/test-root-view`, never the bare `test-root-view` name. Not
// redundant with the webpack branch below, despite looking that way from
// the app-wide walk alone - register the one XML file this app's test
// setup actually looks up by its bare name directly.
if (typeof require !== 'undefined' && typeof (require as any).context === 'function') {
  const context = (require as any).context('./', true, /.*\.(xml)/);
  if (typeof (globalThis as any).registerBundlerModules === 'function') {
    (globalThis as any).registerBundlerModules(context);
  } else {
    (globalThis as any).registerWebpackModules(context);
  }
} else {
  // `{ eager: true }`: resolved statically by Vite at build time, safe even
  // though webpack's bundler will never execute this branch.
  const xmlModules = import.meta.glob('./test-root-view.xml', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
  const testRootViewXml = xmlModules['./test-root-view.xml'];
  // `NativeScript`'s `ModuleNameResolver.getCandidates()` filters registered
  // keys by `moduleName.endsWith(ext)` (`.xml` here) - the key has to keep
  // the extension, "nickname" or not (`registerBundlerModules`'s own
  // nicknames for xml files do too, see the comment above).
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
    // Discover and (via side effect) run every `*-test.*` file under this
    // directory. `require.context` (webpack) vs. `import.meta.glob` (Vite,
    // its native equivalent) - see the top of this file for why both calls
    // can coexist here without either bundler choking on the other's syntax.
    if (typeof require !== 'undefined' && typeof (require as any).context === 'function') {
      const tests = (require as any).context(".", true, /-test\.(ts|gts|js|gjs)$/);
      tests.keys().map(tests);
    } else {
      // Not `{ eager: true }`: an eager glob desugars into *static* imports,
      // hoisted to this module's top level and evaluated the instant
      // `test-helper.ts` itself first loads - long before this `runTests`
      // callback runs (it only fires once `TestBrokerViewModel` gets a real
      // execute command from karma, well after boot). That's too early:
      // karma-qunit's adapter (loaded separately, asynchronously, via
      // `NSUTR: eval script .../karma-qunit/lib/adapter.js`) hooks
      // `QUnit.begin`/`testStart` to count specs, and by the time it
      // attaches, eagerly-registered tests have already been counted (or
      // missed) - reproduced on-device as a clean but wrong "Executed 0 of 0
      // SUCCESS" (every file's `QUnit.module`/`.test` calls ran, just far
      // too soon). `require.context(...).keys().map(tests)` above is lazy
      // for exactly this reason - matching that means importing each
      // matched module for real only once *this* callback actually runs.
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
