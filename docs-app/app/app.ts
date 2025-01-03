import './setup-inspector-support';
import 'decorator-transforms/globals';
import './css/styles.css';
import 'inter-ui/inter-variable-latin.css';
import '@fontsource/lexend';

import compatModules from '@embroider/virtual/compat-modules';
import Application from '@ember/application';

import config from 'docs-app/config/environment';
import loadInitializers from 'ember-load-initializers';
import { sync } from 'ember-primitives/color-scheme';
import Resolver from 'ember-resolver';

import { install } from './icons';
import 'ember-power-select/styles';

sync();
install();

// @babel/traverse (from babel-plugin-ember-template-imports)
// accesses process.....
// maybe one day we can have a browser-only version?
// But they aren't used.... so.. that's fun.
Object.assign(window, {
  process: { env: {} },
  Buffer: {},
});

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver.withModules(compatModules);
}

loadInitializers(App, config.modulePrefix, compatModules);
