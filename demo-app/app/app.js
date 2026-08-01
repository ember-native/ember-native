import Resolver from 'ember-resolver/index.js';
import loadInitializers from 'ember-load-initializers';
import ENV from './config/env';
import EmberNamespace from 'ember';
import './app.scss';
import './configure-signals';
import compatModules from '@embroider/virtual/compat-modules';
import { NativeApplication } from 'ember-native';

window.EmberENV = ENV.EmberENV;
window._Ember = EmberNamespace;
window.Ember = EmberNamespace;


export default class App extends NativeApplication {
  rootElement = ENV.rootElement;
  autoboot = ENV.autoboot;
  modulePrefix = ENV.modulePrefix;
  podModulePrefix = `${ENV.modulePrefix}/pods`;
  Resolver = Resolver.withModules(compatModules);
}

loadInitializers(App, ENV.modulePrefix, compatModules);
