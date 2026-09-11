import EmberApplication from '@ember/application';
import ApplicationInstance from '@ember/application/instance';

/**
 * Base class for an ember-native app's `App` (in `app/app.js`). Every
 * ember-native app needs this exact `buildInstance()` override - it's what
 * makes Ember treat the app as interactive (so event handlers/bindings are
 * wired up) and resolve DOM APIs against ember-native's own `document`
 * (a `DocumentNode`) instead of a real browser `document` - so it isn't a
 * per-app customization point, unlike the rest of `App` (rootElement,
 * modulePrefix, Resolver, ...).
 */
class NativeApplication extends EmberApplication {
  buildInstance() {
    const instance = super.buildInstance();
    instance.setupRegistry = options => {
      options.isInteractive = true;
      options.document = globalThis.document;
      ApplicationInstance.prototype.setupRegistry.call(instance, options);
    };
    return instance;
  }
}

export { NativeApplication };
//# sourceMappingURL=native-application.js.map
