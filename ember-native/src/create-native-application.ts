import type ApplicationClass from '@ember/application';

export function createNativeApplication(
  Application: typeof ApplicationClass,
  env: { modulePrefix: string; APP: { version: string } },
) {
  const app = Application.create({
    // @ts-expect-error `name` isn't part of `EmberApplication.create`'s
    // upstream type, but is a real, supported option.
    name: env.modulePrefix,
    version: env.APP.version,
    ENV: env,
  });

  app.register('config:environment', env);

  return app;
}
