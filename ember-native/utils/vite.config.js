/**
 * Vite configuration pieces required to build an ember-native app with
 * @nativescript/vite.
 *
 * With @nativescript/webpack, @embroider/vite's resolver()/templateTag()
 * plugins had to be bridged into webpack by hand (see
 * embroider-webpack-adapter.js in this same directory, kept for apps that
 * still build with @nativescript/webpack). Under a real Vite bundler none of
 * that bridging is needed: @embroider/vite ships actual Vite/Rollup plugins
 * that can be handed to Vite directly. This helper wires those up alongside
 * the handful of ember-native/NativeScript specific pieces still needed on
 * top - the @glimmer/env alias, and the `window` global NativeScript doesn't
 * otherwise define.
 *
 * Usage in an app's vite.config.ts:
 *
 *   import { defineConfig, mergeConfig } from 'vite';
 *   import { typescriptConfig } from '@nativescript/vite';
 *   import configureEmberNativeVite from 'ember-native/utils/vite.config.js';
 *
 *   export default defineConfig(({ mode }) => {
 *     // ember-native's plugins (classicEmberSupport/ember/babel) are passed
 *     // as the first argument so their `enforce: 'pre'` resolver/template-tag
 *     // plugins run before @nativescript/vite's own resolver.
 *     return mergeConfig(configureEmberNativeVite(), typescriptConfig({ mode }));
 *   });
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
    ],
  };
};
