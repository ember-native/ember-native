// NativeScript has no index.html, so ember-vite-hmr's usual
// transformIndexHtml-injected `<script>` (which sets up
// `globalThis.emberHotReloadPlugin`) never runs. Import it directly instead,
// before anything else so it's in place before Ember boots and looks up
// `service:vite-hot-reload`. No-op (tree-shaken away) outside dev/HMR mode.
import 'ember-vite-hmr/setup-ember-hmr';
import app from './native/main';
import { Application as NativeApplication } from '@nativescript/core/application/application';

function boot() {
  return new Promise((resolve, reject) => {
    NativeApplication.on(NativeApplication.launchEvent, () => {
      setTimeout(() => {
        resolve()
      }, 0)
    });
    try {
      NativeApplication.run({ create: () => {
          return app.rootElement.nativeView;
        } });
    } catch (e) {
      reject(e);
    }
  });
}

const document = globalThis.document;

// `__NS_UNIT_TESTING__` is a Vite `define` set only by vite.test.config.ts
// (see that file for where it reads the CLI's `unitTesting` env flag).
// @nativescript/vite always builds whatever package.json's `main` field
// points to - unlike webpack, it has no separate per-command entry-swap
// mechanism - so `nativescript test android --config
// nativescript.test.vite.config.ts` still boots through this exact file
// too. When false (the default/normal build), esbuild's `define` constant
// folding dead-code-eliminates this whole branch, including the dynamic
// `import()`, so none of `./test.js`'s qunit/ember-qunit/unit-test-runner
// dependency graph reaches the real app bundle.
if (typeof __NS_UNIT_TESTING__ !== 'undefined' && __NS_UNIT_TESTING__) {
  // `./test.js` calls @nativescript/unit-test-runner's own `Application.run`
  // once karma instructs it to - boot() below must not also run the app.
  // Not awaited - nothing in this module runs after this branch, and
  // top-level await's module-loader requirements are an unnecessary risk
  // on NativeScript's own (non-browser) ESM module loader.
  void import('./test.js');
} else {
  boot().then(() => {
    app.visit('/', {
      document: document,
      isInteractive: true
    })
  });

  globalThis.app = app;
}
