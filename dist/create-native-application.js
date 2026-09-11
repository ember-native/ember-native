function createNativeApplication(Application, env) {
  const app = Application.create({
    // @ts-expect-error `name` isn't part of `EmberApplication.create`'s
    // upstream type, but is a real, supported option.
    name: env.modulePrefix,
    version: env.APP.version,
    ENV: env
  });
  app.register('config:environment', env);
  return app;
}

export { createNativeApplication };
//# sourceMappingURL=create-native-application.js.map
