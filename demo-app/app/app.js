import EmberApplication from '@ember/application';
import Resolver from 'ember-resolver/index.js';
import loadInitializers from 'ember-load-initializers';
import ENV from './config/env';
import EmberNamespace from 'ember';
import './app.scss';
import ApplicationInstance from "@ember/application/instance";
import './configure-signals';
import compatModules from '@embroider/virtual/compat-modules';

window.EmberENV = ENV.EmberENV;
window._Ember = EmberNamespace;
window.Ember = EmberNamespace;


export default class App extends EmberApplication {
  rootElement = ENV.rootElement;
  autoboot = ENV.autoboot;
  modulePrefix = ENV.modulePrefix;
  podModulePrefix = `${ENV.modulePrefix}/pods`;
  Resolver = Resolver.withModules(compatModules);

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

loadInitializers(App, ENV.modulePrefix, compatModules);
