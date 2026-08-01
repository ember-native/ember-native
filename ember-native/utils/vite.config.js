/**
 * Vite configuration pieces required to build an ember-native app with
 * @nativescript/vite.
 *
 * @embroider/vite ships actual Vite/Rollup plugins (resolver()/templateTag())
 * that can be handed to Vite directly - this helper wires those up alongside
 * the handful of ember-native/NativeScript specific pieces still needed on
 * top - the @glimmer/env alias, and the `window` global NativeScript doesn't
 * otherwise define. (An older @nativescript/webpack-based build path used to
 * need these bridged into webpack by hand - see VITE_MIGRATION_NOTES.md;
 * webpack support has since been fully removed.)
 *
 * Consuming apps should not call this directly - use
 * `ember-native/utils/nativescript-vite.config.js`'s `configureNativeScriptVite()`
 * instead, which wraps this together with `@nativescript/vite`'s own
 * `typescriptConfig()` and the alias-ordering/`NS_HMR_HOST`/`@vite/env` fixes
 * both need (see that file's docstring for the full usage example, and why a
 * hand-rolled `mergeConfig(configureEmberNativeVite(), typescriptConfig({ mode }))`
 * in an app's own `vite.config.ts` - the pattern this file used to document
 * here - reproduces bugs that helper already fixes).
 *
 * This file stays a separate module (rather than folding into
 * `nativescript-vite.config.js`) only because it's also usable standalone by
 * a hypothetical non-`@nativescript/vite` Vite consumer that needs just the
 * Ember/Embroider plugin wiring, with no NativeScript-specific config layered
 * on top.
 *
 * @param {object} [options]
 * @param {object} [options.babel] - overrides merged into the default
 *   `@rollup/plugin-babel` invocation (e.g. to add plugins).
 * @returns {import('vite').UserConfig}
 */
module.exports = function configureEmberNativeVite(options = {}) {
  const { classicEmberSupport, ember, extensions } = require('@embroider/vite');
  const { babel } = require('@rollup/plugin-babel');
  const replace = require('@rollup/plugin-replace');
  const dependencySourcePatches = require('./vite-dependency-patches.js');

  return {
    resolve: {
      extensions,
      alias: [
        { find: '@glimmer/env', replacement: require.resolve('./glimmer-env.js') },
        // See json-to-ast-esm-shim.js for why this needs its own hand-rolled
        // CJS/ESM interop shim instead of resolving normally. Matched via an
        // exact-match regex, not a plain string: Vite's string `find` aliases
        // also match subpaths (`json-to-ast/whatever` -> `<replacement>/whatever`),
        // which would wrongly redirect the shim's own
        // `import 'json-to-ast/build.js'` right back at itself.
        { find: /^json-to-ast$/, replacement: require.resolve('./json-to-ast-esm-shim.js') },
        // See qunit-esm-shim.js for why this needs its own hand-rolled
        // CJS/ESM interop shim instead of resolving normally. Matched via an
        // exact-match regex, not a plain string, for the same reason as
        // json-to-ast above: the shim's own `import ... from
        // 'qunit/qunit/qunit.js'` must not be redirected back at itself.
        { find: /^qunit$/, replacement: require.resolve('./qunit-esm-shim.js') },
      ],
    },
    define: {
      // NativeScript's JS environment doesn't define `window`; Ember itself
      // and several addons still reference it directly at module scope.
      window: 'globalThis',
    },
    plugins: [
      ...classicEmberSupport(),
      ...ember(),
      babel({
        babelHelpers: 'runtime',
        extensions,
        ...options.babel,
      }),
      // The NativeScript Android runtime's embedded V8 doesn't implement
      // `structuredClone`, and @warp-drive's graph code references the bare
      // global at *module top level* (`const cp = structuredClone;`), not
      // lazily inside a function. Polyfilling it from app code (a
      // `globalThis.structuredClone = ...` in the app's own entry, or a
      // `polyfills.ts` @nativescript/vite loads before the main entry)
      // doesn't help: @embroider/vite/@nativescript/vite always emit
      // `vendor.mjs` as a real ES module that the app's own `bundle.mjs`
      // *statically imports from*, and ES import hoisting guarantees
      // vendor.mjs's top-level code (including that bare reference) runs
      // before a single line of `bundle.mjs`'s own body - there is no JS
      // that can run "before" a module's own static import dependencies.
      // A build-time text substitution fixes this regardless of chunk load
      // order, since it replaces the bare identifier before the
      // chunking/ordering question is even relevant. Vite's own `define`
      // can't express this: it runs through esbuild, which only accepts an
      // identifier or JS literal as the replacement (not a fallback
      // expression), so this uses `@rollup/plugin-replace` instead, which
      // does plain text substitution with no such restriction.
      replace({
        preventAssignment: true,
        // The default delimiters only guard against matching
        // `structuredClone.foo` (a following `.`); they don't guard against
        // `foo.structuredClone` (a *preceding* `.`, i.e. an unrelated
        // property of the same name) - without excluding that too, the
        // replacement text's own `globalThis.structuredClone` reference
        // gets recursively matched and mangled into invalid syntax.
        delimiters: ['(?<![_$a-zA-Z0-9\\xA0-\\uFFFF.])', '(?![_$a-zA-Z0-9\\xA0-\\uFFFF])(?!\\.)'],
        values: {
          structuredClone:
            '(globalThis.structuredClone || function (value) { return JSON.parse(JSON.stringify(value)); })',
        },
      }),
      earlyGlobalsBanner(),
      dependencySourcePatches(),
    ],
  };
};

/**
 * @nativescript/vite's `manualChunks` (configuration/base.js) always buckets
 * generic node_modules dependencies - including `@ember/test-helpers` - into
 * a single `vendor.mjs` chunk, kept separate from the app's own `bundle.mjs`.
 * `bundle.mjs` (where `ember-native`'s `src/setup.ts` `setup()` runs) always
 * has a real static import back into `vendor.mjs` (at minimum for
 * `@glimmer/runtime`, which `setup.ts` imports directly) - and per the
 * ECMAScript module spec, a module's imports always finish evaluating before
 * any of the importing module's own top-level code runs, *regardless* of
 * where in the importing module's source that import is textually
 * positioned. That means `vendor.mjs` as a whole is always fully evaluated
 * before a single line of `bundle.mjs`'s own body runs - no reordering of
 * `bundle.mjs`-side imports (app entry point, `demo-app/app/test.js`,
 * `@nativescript/vite`'s own `polyfills.ts` extension point, etc.) can ever
 * change that, since all of those live in `bundle.mjs`, not `vendor.mjs`.
 *
 * A couple of `vendor.mjs`-bundled dependencies (`@ember/test-helpers`'s
 * `dist/-internal/deprecations.js`/`warnings.js` and `dist/dom/fire-event.js`)
 * reference `document`/`MouseEvent` at their own module top level, before
 * `ember-native`'s `setup()` (which only runs later, from `bundle.mjs`) has
 * installed the real NativeScript-backed globals for them - `document` isn't
 * defined at all yet, and `document.location` access throws;
 * `typeof MouseEvent` is `undefined`, so `fire-event.js` permanently caches
 * "no MouseEvent constructor" for its own module lifetime.
 *
 * Rather than patching those dependencies to defer their global lookups (the
 * previous fix, `patches/@ember__test-helpers.patch`), this plugin prepends
 * a small banner of placeholder globals to every emitted chunk's own source
 * text via Rollup's `renderChunk` hook - unlike an `import`, banner text has
 * no dependencies of its own to wait on, so it always runs as the first
 * synchronous statements of whichever chunk it's part of, including
 * `vendor.mjs` itself. That's enough: `deprecations.js`/`warnings.js` only
 * ever read `document.location` once, at their own module top level (an
 * empty placeholder satisfies that); `fire-event.js` only *caches a boolean*
 * from its early check; the actual `new MouseEvent(type, opts)` call it
 * makes later (when a test's `click()` really runs) looks up `MouseEvent` on
 * `globalThis` fresh at call time, long after `setup()` has overwritten this
 * placeholder with the real, tap-translating implementation.
 *
 * The placeholder `document` needs a no-op `createElement` too, not just
 * `location` - confirmed by a real on-device crash (`Module evaluation
 * promise rejected`, no further detail, reproduced with a temporary
 * checkpoint-logging instrumentation of the whole chunk since the native
 * side swallows the actual JS error): `@nativescript/vite`'s own generated
 * entry chunk always includes Vite's `__vitePreload` helper module, which
 * calls a `detectScriptRel()` IIFE *unconditionally, at chunk top level*
 * (`typeof document !== 'undefined' && document.createElement('link').relList`)
 * - completely unrelated to `@ember/test-helpers` or this app's own code.
 * Before this banner existed, `document` was genuinely `undefined` at that
 * point, so the `&&` short-circuited and `document.createElement` was never
 * called. Once the banner makes `document` "defined" (to satisfy
 * `@ember/test-helpers`), that short-circuit no longer protects this call,
 * and a placeholder without `createElement` throws a few lines into the
 * chunk, before any app code (including `setup()`) has had a chance to run.
 */
function earlyGlobalsBanner() {
  const banner = [
    "if (typeof globalThis.document === 'undefined') {",
    "  globalThis.document = { location: { search: '' }, createElement: function () { return {}; } };",
    '}',
    "if (typeof globalThis.MouseEvent === 'undefined') {",
    '  globalThis.MouseEvent = function MouseEvent(type, eventOpts) {',
    '    Object.assign(this, eventOpts, { type: type });',
    '  };',
    '}',
  ].join('\n');

  return {
    name: 'ember-native-early-globals-banner',
    renderChunk(code) {
      return { code: `${banner}\n${code}`, map: null };
    },
  };
}
