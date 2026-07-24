// Must be the very first thing `app/test.js` imports (see its own comment for
// why import order matters here). qunit.js reads `window.location` at its own
// module-load time to populate `QUnit.urlParams`, which `ember-qunit`'s
// bundled `qunit-configuration.js` then unconditionally reads
// (`QUnit.urlParams.devmode`) - on a real browser `window.location` always
// exists, but NativeScript has no such global, so without this shim
// `QUnit.urlParams` stays undefined and `ember-qunit` crashes on import with
// "Cannot read properties of undefined (reading 'devmode')".
//
// Deliberately does *not* set `globalThis.document`: qunit.js has a second,
// separate environment check for its HTML reporter that requires *both*
// `window` and `document` to be present. `ember-native`'s own `setup()` (run
// right after this file, from `./native/setup-ember-native`) sets `document`
// for real - if that ran first instead, qunit would see a "browser" and
// crash immediately trying to attach a DOM event listener.
globalThis.window = {
  location: {
    href: '',
    host: '',
    hostname: '',
    pathname: '',
    search: '',
    origin: '',
    protocol: 'none',
  },
};
