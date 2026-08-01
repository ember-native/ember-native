import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.embernativedemo',
  appPath: 'app',
  main: "app/boot.js",
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  },
  cli: {
    packageManager: 'pnpm',
  },
  bundler: 'vite',
  bundlerConfigPath: 'vite.config.ts',
} as NativeScriptConfig;
