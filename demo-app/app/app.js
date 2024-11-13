import EmberApplication from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import ENV from './config/env';
import EmberNamespace from 'ember';
import { name as pkgName } from '../package.json';

window.EmberENV = ENV.EmberENV;
window._Ember = EmberNamespace;
window.Ember = EmberNamespace;


const modules = {};
let context = require.context(
  '.',
  true,
  /^\.\/.*\.(js|ts|gjs|gts|hbs)$/,
  'sync'
);
context.keys().forEach((key) => (modules[pkgName + key.slice(1).replace(/\.(ts|js|gts|gjs|hbs)$/, '')] = context(key)));

context = require.context(
  '../node_modules/ember-routable-component/dist/_app_',
  true,
  /^\.\/.*\.(js|ts|gjs|gts|hbs)$/,
  'sync'
);
context.keys().forEach((key) => (modules[pkgName + key.slice(1).replace(/\.(ts|js|gts|gjs|hbs)$/, '')] = context(key)));

context = require.context(
  '../node_modules/ember-native/dist/_app_',
  true,
  /^\.\/.*\.(js|ts|gjs|gts|hbs)$/,
  'sync'
);
context.keys().forEach((key) => (modules[pkgName + key.slice(1).replace(/\.(ts|js|gts|gjs|hbs)$/, '')] = context(key)));

export default class App extends EmberApplication {
  rootElement = ENV.rootElement;
  autoboot = ENV.autoboot;
  modulePrefix = ENV.modulePrefix;
  podModulePrefix = `${ENV.modulePrefix}/pods`;
  Resolver = Resolver.withModules(modules);
}


loadInitializers(App, ENV.modulePrefix, modules);
