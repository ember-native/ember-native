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


boot().then(() => {
  app.visit('/', {
    document: document,
    isInteractive: true
  })
});

globalThis.app = app;
