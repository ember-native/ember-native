// `@nativescript/vite` always builds whatever `package.json`'s `main` field
// points to (this file), so it stays a tiny, static dispatcher. The bare
// `ember-native-app-entry` specifier is aliased per Vite config - real app
// builds (`vite.config.ts`) point it at `../boot-app.js`, test builds
// (`vite.test.config.ts`) point it at `../boot-test.js`.
//
// `boot-app.js`/`boot-test.js` deliberately live outside `app/` (unlike this
// file, which must stay under `app/` for NativeScript's `appPath`/`main`
// convention) so that Ember CLI's classic module-compat registry, which
// eagerly imports everything under `app/`, doesn't also pull them in
// directly.
//
// Ensures Android's native Activity wrapper is registered synchronously
// before app launch, rather than relying only on the framework's own
// deferred registration.
import '@nativescript/core/ui/frame/activity.android.js?ns-keep';
import 'ember-native-app-entry';
