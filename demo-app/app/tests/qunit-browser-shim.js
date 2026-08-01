// Must be the very first thing `app/test.js` imports. QUnit expects a
// `window.location` to exist at module-load time; NativeScript has no such
// global, so provide a minimal stand-in.
//
// Deliberately does *not* set `globalThis.document` - QUnit's HTML reporter
// only activates when both `window` and `document` are present, and
// ember-native's own setup (run right after this file) sets `document` for
// real.
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
