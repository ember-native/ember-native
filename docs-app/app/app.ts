import 'decorator-transforms/globals';

import Application from '@ember/application';
import compatModules from '@embroider/virtual/compat-modules';

import loadInitializers from 'ember-load-initializers';
import { sync } from 'ember-primitives/color-scheme';
import Resolver from 'ember-resolver';

import config from './config/environment';
import { install } from './icons';

sync();
install();


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
