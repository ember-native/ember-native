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

// Vite's own dynamic-import "module preload" runtime helper
// (`__vitePreload`, auto-injected around every real `import()` expression -
// including `./test.js` below) assumes a browser: when the target chunk has
// CSS deps to preload (it does here), it does an unguarded
// `document.getElementsByTagName(...)`/`.querySelector(...)`/
// `.createElement("link")`/`.head.appendChild(...)`. `ember-native`'s own
// `document` shim (set up by `./native/main`'s own import graph, already
// evaluated by this point) is a virtual-DOM stand-in, not a real
// `Document` - `build.modulePreload: false` in vite.test.config.ts doesn't
// suppress this wrapper (it only stops Vite injecting a real
// `<link rel=modulepreload>` polyfill). Patch in no-op fallbacks for
// whichever of these the real shim doesn't already provide; nothing in
// this flow needs them to do anything real.
if (typeof document.getElementsByTagName !== 'function') {
  document.getElementsByTagName = () => [];
}
if (typeof document.querySelector !== 'function') {
  document.querySelector = () => null;
}
if (!document.head) {
  document.head = { appendChild() {} };
}
// `document.createElement` *does* already exist here - it's
// `ember-native`'s real element factory, used throughout the actual app to
// create native UI elements (`label`, `button`, ...) - so it can't just be
// stubbed out wholesale. But `__vitePreload` calls it with `"link"`, which
// isn't a real NativeScript component, and the real factory throws
// (`TypeError: No known component for element link.`) rather than
// returning null/undefined for an unknown tag. Wrap it: fall through to
// the stub only for tag names the real factory doesn't recognize, so real
// element creation elsewhere is untouched.
const nativeCreateElement = document.createElement.bind(document);
document.createElement = (tagName) => {
  try {
    return nativeCreateElement(tagName);
  } catch (e) {
    return { setAttribute() {}, relList: undefined };
  }
};

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
