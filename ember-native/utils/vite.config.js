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
 *
 * The same short-circuit hazard bit a second, unrelated vendor: `document`
 * being "defined" also un-short-circuits `typeof document === 'undefined'`
 * guards in *any* vendor-bundled library, not just the two above - root
 * caused downstream (in a consumer app, then reproduced against this repo's
 * own `demo-app`) to `@glimmer/runtime`'s legacy DOM-compat detection, which
 * on `ember-source <= 6.9.x` still runs at `@glimmer/runtime`'s own module
 * top level (removed in later `ember-source` versions, which is why this
 * repo's own `demo-app` - pinned to `ember-source ^6.12.0` - never hit it):
 * `applyTextNodeMergingFix()`'s feature test does
 * `document.createElement('div').appendChild(document.createTextNode('first'))`
 * and inspects `childNodes.length` afterwards. Against the placeholder above,
 * `createElement('div')` returns a plain `{}` with no `appendChild`, and
 * `createTextNode` doesn't exist at all - either throws a `TypeError` at
 * `vendor.mjs` module-evaluation time, again surfacing only as the
 * contentless `Module evaluation promise rejected: vendor.mjs` boot crash,
 * indistinguishable on-device from the `@ember/test-helpers` failure this
 * banner was originally added to fix. The placeholder `document` therefore
 * needs `createTextNode`/`createComment`/`createElementNS`, and the elements
 * `createElement`/`createElementNS` return need a real `appendChild` (that
 * actually records children in `childNodes`, so length-based feature tests
 * like `applyTextNodeMergingFix()`'s see accurate results and skip the fix
 * rather than mis-detecting merging support) and an `insertAdjacentHTML` that
 * also records a child, not a no-op - a no-op isn't enough on its own.
 * `applyTextNodeMergingFix()`'s feature test does
 * `document.createElement('div').appendChild(createTextNode('first'))` then
 * `insertAdjacentHTML('beforeend', 'second')`, and checks
 * `childNodes.length === 2` to conclude no fix is needed; against a no-op it
 * always saw `1` and unconditionally applied the "useless comment" DOM-churn
 * workaround on every render. Worse, `applySVGInnerHTMLFix()`'s feature test
 * does `createElementNS(svgNamespace, 'svg')` then
 * `insertAdjacentHTML('beforeend', ...)`, checking `childNodes.length === 1
 * && firstChild.namespaceURI === SVG_NAMESPACE`; against a no-op it always
 * saw `childNodes.length === 0` and unconditionally installed its SVG-fix
 * `insertHTMLBefore` override, which closes over a `div` created from *this*
 * placeholder `document` for the module's lifetime - the very first real
 * inline-SVG render later calls `div.insertAdjacentHTML(...)` then reads
 * `div.firstChild.firstChild`, crashing on the still-empty placeholder
 * `div`. Having `insertAdjacentHTML` record a placeholder child node
 * (inheriting the parent's `namespaceURI`, so an SVG element's recorded
 * child reports the SVG namespace) makes both feature tests see the same
 * "no fix needed" result a real DOM would, so neither subclass - and
 * therefore neither bug - is ever reached.
 */
function earlyGlobalsBanner() {
  const banner = [
    "if (typeof globalThis.document === 'undefined') {",
    '  var createEmberNativePlaceholderElement = function (namespaceURI) {',
    '    return {',
    '      namespaceURI: namespaceURI,',
    '      childNodes: [],',
    '      firstChild: null,',
    '      lastChild: null,',
    '      appendChild: function (child) {',
    '        this.childNodes.push(child);',
    '        this.firstChild = this.childNodes[0];',
    '        this.lastChild = child;',
    '        return child;',
    '      },',
    '      insertAdjacentHTML: function (position) {',
    '        var child = { nodeType: 1, namespaceURI: this.namespaceURI };',
    "        if (position === 'afterbegin') {",
    '          this.childNodes.unshift(child);',
    '        } else {',
    '          this.childNodes.push(child);',
    '        }',
    '        this.firstChild = this.childNodes[0];',
    '        this.lastChild = this.childNodes[this.childNodes.length - 1];',
    '        return child;',
    '      },',
    '    };',
    '  };',
    '  globalThis.document = {',
    "    location: { search: '' },",
    '    createElement: function () {',
    '      return createEmberNativePlaceholderElement();',
    '    },',
    '    createElementNS: function (namespaceURI) {',
    '      return createEmberNativePlaceholderElement(namespaceURI);',
    '    },',
    '    createTextNode: function (data) {',
    '      return { nodeType: 3, data: data };',
    '    },',
    '    createComment: function (data) {',
    '      return { nodeType: 8, data: data };',
    '    },',
    '  };',
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
