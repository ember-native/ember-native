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
const context1 = require.context(
  '.',
  true,
  /^\.\/.*\.(js|ts|gjs|gts|hbs)$/,
  'sync'
);
context1.keys().forEach((key) => (modules[pkgName + key.slice(1).replace(/\.(ts|js|gts|gjs|hbs)$/, '')] = context1(key)));

const context2 = require.context(
  '../node_modules/ember-routable-component/dist/_app_',
  true,
  /^\.\/.*\.(js|ts|gjs|gts|hbs)$/,
  'sync'
);
context2.keys().forEach((key) => (modules[pkgName + key.slice(1).replace(/\.(ts|js|gts|gjs|hbs)$/, '')] = context2(key)));

const context3 = require.context(
  '../node_modules/ember-native/dist/_app_',
  true,
  /^\.\/.*\.(js|ts|gjs|gts|hbs)$/,
  'sync'
);
context3.keys().forEach((key) => (modules[pkgName + key.slice(1).replace(/\.(ts|js|gts|gjs|hbs)$/, '')] = context3(key)));

function findModuleId(module) {
  const entry = Object.entries(require.cache).find(([k, v]) => v === module);
  return entry?.[0];
}


if (module.hot) {
  const modulesBefore = Object.assign({}, modules);
  module.hot.accept(context1.id, function() {
    const context = require.context(
      '.',
      true,
      /^\.\/.*\.(js|ts|gjs|gts|hbs)$/,
      'sync'
    );
    context.keys().forEach((key) => (modules[pkgName + key.slice(1).replace(/\.(ts|js|gts|gjs|hbs)$/, '')] = context(key)));
    for (const name of Object.keys(modulesBefore)) {
      const module = modules[name];
      if (name.includes('initializers') && modulesBefore[name]?.default !== module.default) {
        const moduleId = findModuleId(module);
        if (require.cache[moduleId]) {
          require.cache[moduleId].hot.invalidate();
          module.hot.apply();
        }
      }
    }
  });
}

export default class App extends EmberApplication {
  rootElement = ENV.rootElement;
  autoboot = ENV.autoboot;
  modulePrefix = ENV.modulePrefix;
  podModulePrefix = `${ENV.modulePrefix}/pods`;
  Resolver = Resolver.withModules(modules);
}


loadInitializers(App, ENV.modulePrefix, modules);
