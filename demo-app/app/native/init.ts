import type ApplicationClass from '@ember/application';


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
