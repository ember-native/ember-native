import { createRequire } from 'node:module';
import { defineConfig, mergeConfig } from 'vite';
import { typescriptConfig } from '@nativescript/vite';
import { hmr } from 'ember-vite-hmr';
// eslint-disable-next-line import/no-unresolved
import configureNativeScriptVite from 'ember-native/utils/nativescript-vite.config.js';

const require = createRequire(import.meta.url);

export default defineConfig(({ mode }) =>
  configureNativeScriptVite({
    mode,
    mergeConfig,
    typescriptConfig,
    hmr,
    require,
    entry: require.resolve('./boot-app.js'),
    // These are only needed by this app's own dependencies - see
    // `ember-native/utils/nativescript-vite.config.js`'s docstring for what
    // the base exclude list already covers, and why over-listing here is
    // harmless even if a build doesn't include all of these.
    vendorExclude: [
      'ember-native-devtools',
      '@warp-drive/core',
      '@warp-drive/json-api',
      '@warp-drive/schema-record',
      'octokit',
      'chromedriver',
      'selenium-webdriver',
      '@nativescript/unit-test-runner',
    ],
  }),
);
