const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '@rollup/rollup-win32-x64-msv' || parent?.id?.includes('rollup')) {
    // console.log('load', request, parent.id);
  }

  const parentFile = parent?.filename ? fs.realpathSync(parent?.filename) : undefined;
  if (parentFile) {
    parent.filename = parentFile;
    parent.id = parentFile;
    parent.path = path.dirname(parentFile);
  }
  return originalLoad.call(this, request, parent, isMain);
}

import { NativeScriptConfig } from '@nativescript/core';


export default {
  id: 'org.nativescript.embernativedemo',
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  },
  bundler: "vite",
  bundlerConfigPath: "vite.config.ts",
} as NativeScriptConfig;
