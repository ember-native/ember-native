// NativeScript has no index.html, so ember-vite-hmr's usual
// transformIndexHtml-injected `<script>` (which sets up
// `globalThis.emberHotReloadPlugin`) never runs. Import it directly instead,
// before anything else so it's in place before Ember boots and looks up
// `service:vite-hot-reload`. No-op (tree-shaken away) outside dev/HMR mode.
import 'ember-vite-hmr/setup-ember-hmr';
import app from './app/native/main';
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

boot().then(() => {
  app.visit('/', {
    document: document,
    isInteractive: true
  })
});

globalThis.app = app;
