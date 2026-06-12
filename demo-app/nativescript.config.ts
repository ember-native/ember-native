import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.embernativedemo',
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  cli: {
    packageManager: 'pnpm',
  },
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;
