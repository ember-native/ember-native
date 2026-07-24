'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');
  let app = new EmberApp(defaults, {
    emberData: {
      deprecations: {
        // New projects can safely leave this deprecation disabled.
        // If upgrading, to opt-into the deprecated behavior, set this to true and then follow:
        // https://deprecations.emberjs.com/id/ember-data-deprecate-store-extends-ember-object
        // before upgrading to Ember Data 6.0
        DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: false,
      },
    },
    // Add options here
  });

  return compatBuild(app, buildOnce, {
    // NativeScript requires every native-facing file (pages, native setup,
    // AND tests) to live under `app/`, unlike classic ember-cli's convention
    // of a separate top-level `tests/` directory. Without this, Embroider's
    // `getAppFiles()`/`AppFiles` (see `@embroider/core/dist/src/app-files.js`)
    // treats the *entire* `app/` tree as the app's module namespace, so
    // `app/test.js` and `app/tests/**` (this project's actual QUnit test
    // entry/suite, see `app/tests/test-helper.ts`) get swept into
    // `otherAppFiles` and eagerly imported by the generated
    // `-embroider-entrypoint.js` right alongside real app code - which
    // matters because `@nativescript/vite` always sets Rollup's
    // `inlineDynamicImports: true` (only 3 fixed output files - bundle/vendor/
    // runtime - are ever loaded), so even a *dynamic* `import()` inside those
    // test files still gets eagerly evaluated at app boot, not lazily
    // deferred. `@ember/test-helpers`/`ember-qunit`/`qunit-dom` assume a
    // browser DOM at module top level (e.g. `document.location.search`),
    // which crashes app boot with a generic, cause-less "Module evaluation
    // promise rejected" error on every regular `nativescript build/debug
    // android`, not just `nativescript test android`.
    // `staticAppPaths` is Embroider's supported escape hatch for exactly
    // this: paths listed here are ones the app promises to wire up itself
    // (this project's `app/test.js` already does its own manual
    // `require.context` scan), so Embroider skips auto-registering them.
    staticAppPaths: ['tests', 'test.js'],
  });
};
