import './setup-ember-native';
import App from  '../app';
import type ApplicationClass from '@ember/application';
import ENV from '../config/env';


export function init(
  Application: typeof ApplicationClass,
  env
) {

  const app = Application.create({
    name: env.modulePrefix,
    version: env.APP.version,
    ENV: env
  });

  app.register('config:environment', env);

  return app;
}


export default init(App, ENV);
