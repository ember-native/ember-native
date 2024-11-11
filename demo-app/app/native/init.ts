import ENV from './env';
import type ApplicationClass from '@ember/application';
import type RouteClass from './router';
import registry from './registry';
import DocumentNode from 'ember-native/dom/nodes/DocumentNode';


export function init(
  Application: typeof ApplicationClass,
  Router: typeof RouteClass
) {

  const app = Application.create({
    name: ENV.modulePrefix,
    version: ENV.APP.version,
    ENV: ENV
  });

  const registryObjects = registry();

  Object.keys(registryObjects).forEach((key) => {
    const value = registryObjects[key];
    app.register(key, value);
  });

  app.register('config:environment', ENV);

  return app;
}
