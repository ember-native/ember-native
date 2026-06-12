import app from './native/main';
import { Application as NativeApplication } from '@nativescript/core/application/application';
import { setupEmberInspector, loadEmberDebug } from 'ember-native-devtools/client';

function boot() {
  return new Promise((resolve, reject) => {
    NativeApplication.on(NativeApplication.launchEvent, () => {
      setTimeout(() => {
        resolve()
      }, 0)
    });
    try {
      NativeApplication.run({ create: () => {
          const nv = app.rootElement.nativeView;
          console.log('[BOOT] rootElement nativeView:', nv, nv?.constructor?.name);
          return nv;
        } });
    } catch (e) {
      reject(e);
    }
  });
}


const document = globalThis.document;


boot().then(() => {
  console.log('[BOOT] launch done, calling visit...');
  console.log('[BOOT] rootElement childNodes before visit:', app.rootElement.childNodes?.length);
  app.visit('/', {
    document: document,
    isInteractive: true
  }).then(() => {
    console.log('[BOOT] visit resolved');
    console.log('[BOOT] rootElement childNodes after visit:', app.rootElement.childNodes?.length);
    const firstChild = app.rootElement.childNodes?.[0];
    console.log('[BOOT] first child:', firstChild?.tagName, firstChild?.nativeView?.constructor?.name);
    // Log document.page (the <page> element detected by DocumentNode)
    const docNode = globalThis.document;
    console.log('[BOOT] document.page:', docNode.page?.tagName, docNode.page?.nativeView?.constructor?.name);
    const client = setupEmberInspector({ serverUrl: 'http://10.0.2.2:9230' });
    setInterval(() => {
      if (!client.socket?.connected) {
        client.socket.connect();
      }
    }, 5000);
    loadEmberDebug();
  }).catch((err) => {
    console.error('[BOOT] visit FAILED:', err?.message || err, err?.stack);
  });
}).catch((err) => {
  console.error('[BOOT] boot FAILED:', err?.message || err);
});

globalThis.app = app;
