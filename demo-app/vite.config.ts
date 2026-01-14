// Set environment variable BEFORE any imports to ensure it's available during plugin initialization
process.env.NS_VENDOR_EXCLUDE = [
  // Ember packages - handled by Ember vite plugin
  '@ember/test-waiters',
  '@embroider/macros',
  'ember-load-initializers',
  'ember-modifier',
  'ember-native',
  'ember-native-devtools',
  'ember-source',
  '@glimmer/component',
  '@glimmer/tracking',
  '@ember/template-compilation',
  '@ember/component',
  '@ember/string',
  '@ember/render-modifiers',
  'ember-concurrency',
  'ember-truth-helpers',
  'ember-get-config',
  'ember-maybe-import-regenerator',
  'ember-cli-babel',
  'ember-cli-htmlbars',
  'ember-resolver',
  'ember-routable-component',
  'ember-compatibility-helpers',
  // NativeScript packages that depend on @nativescript/core (already excluded)
  '@nativescript/theme',
  'nativescript-ui-listview',
  'nativescript-ui-sidedrawer',
  '@nativescript/unit-test-runner',
  // Dev/test packages not needed in vendor
  'octokit',
  'chromedriver',
  'selenium-webdriver',
].join(',');

import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { typescriptConfig } from '@nativescript/vite';
import Module from 'module';

const req = Module.prototype.require;
Module.prototype.require = function (...args) {
  return req.call(this, ...args);
}

export default defineConfig(({ mode }) => {
  const config = typescriptConfig({ mode });
  config.plugins = [
    classicEmberSupport(),
    ember(),
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
    ...config.plugins
  ];
  return config;
});
