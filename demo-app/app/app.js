import EmberApplication from '@ember/application';
import Resolver from 'ember-resolver/index.js';
import loadInitializers from 'ember-load-initializers';
import ENV from './config/env';
import EmberNamespace from 'ember';
import './app.scss';
import ApplicationInstance from "@ember/application/instance";
import Router from "./router";
import './configure-signals';
import compatModules from '@embroider/virtual/compat-modules';

window.EmberENV = ENV.EmberENV;
window._Ember = EmberNamespace;
window.Ember = EmberNamespace;

// Use Embroider's virtual compat-modules instead of custom registerModules
const modules = compatModules;

// Add router to modules
modules[ENV.modulePrefix + '/router'] = {
  default: Router
}

export default class App extends EmberApplication {
  rootElement = ENV.rootElement;
  autoboot = ENV.autoboot;
  modulePrefix = ENV.modulePrefix;
  podModulePrefix = `${ENV.modulePrefix}/pods`;
  Resolver = Resolver.withModules(modules);

  buildInstance() {
    const instance = super.buildInstance();
    instance.setupRegistry = (options) => {
      options.isInteractive = true;
      options.document = globalThis.document;
      ApplicationInstance.prototype.setupRegistry.call(instance, options);
    }
    return instance;
  }
}

loadInitializers(App, ENV.modulePrefix, modules);
