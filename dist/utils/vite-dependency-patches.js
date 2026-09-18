/**
 * Build-time replacement for pnpm patches on npm dependencies that end up
 * bundled into the app's own Vite/Rollup output (as opposed to dependencies
 * only used by host-side tooling like the NativeScript CLI or the Karma
 * launcher, which never pass through this pipeline and can't be reached this
 * way).
 *
 * A pnpm patch mutates the dependency's files on disk in
 * `node_modules/.pnpm/...`, which has to be kept in sync by hand (via
 * `pnpm patch`/`pnpm patch-commit`) whenever the dependency version bumps.
 * This does the equivalent source edit instead as a Vite `transform` hook
 * matched by module id, so the fix lives entirely in this repo and
 * `node_modules` stays byte-for-byte what `pnpm install` produced.
 *
 * Each entry's `apply()` throws if its expected original text isn't found,
 * rather than silently leaving the bug unfixed - the same failure mode a
 * pnpm patch gets for free (`pnpm install` refuses to proceed if a patch no
 * longer applies) has to be reproduced explicitly here.
 */

function replaceOnce(code, id, from, to) {
  const index = code.indexOf(from);
  if (index === -1) {
    throw new Error(
      `ember-native dependency patch: expected to find ${JSON.stringify(from)} in ${id}, but it was not present. ` +
        `The dependency likely changed - re-diff it against the fix this transform is meant to apply and update ` +
        `ember-native/utils/vite-dependency-patches.js.`,
    );
  }
  return code.slice(0, index) + to + code.slice(index + from.length);
}

const patches = [
  {
    // @ember/test-waiters's `import { warn } from '@ember/debug'` binding
    // sometimes fails to link under this Rollup pipeline
    // (`ReferenceError: warn is not defined` at the call site), even though
    // `@ember/debug`'s real `warn` implementation is present elsewhere in
    // the bundle - same class of cross-module ESM linking issue as the
    // CJS-interop bugs elsewhere in this file. `warn` is a dev-only debug
    // helper, so falling back to a no-op when the binding didn't link is
    // safe.
    //
    // `@embroider/macros`'s babel plugin (run earlier, via `ember()`'s own
    // babel config in `vite.config.js`) recognizes `@ember/debug`'s `warn`
    // as one of its debug macros and rewrites call sites to `true &&
    // warn(...)`, *removing the original `import { warn } from
    // '@ember/debug';` line entirely* in the process - so this can't be a
    // plain find-and-replace on that import line, since by the time this
    // hook runs the import is already gone and only the bare `warn`
    // references remain. Unconditionally prepend a fresh, differently-named
    // import instead (bypassing macro recognition, since macros already ran
    // and won't reprocess this text) and strip the original import line only
    // if it happens to still be there, so this is safe whichever shape the
    // macro transform left the file in.
    match: /[\\/]@ember[\\/]test-waiters[\\/]dist[\\/]index\.js$/,
    apply(code) {
      const withoutOriginalImport = code.replace("import { warn } from '@ember/debug';\n", '').replace("import { warn } from '@ember/debug';", '');
      return (
        "import { warn as warn$imported } from '@ember/debug';\n" +
        'const warn = typeof warn$imported === \'function\' ? warn$imported : function () {};\n' +
        withoutOriginalImport
      );
    },
  },
  {
    // engine.io-client's websocket transport captures `BrowserWebSocket`
    // from `global.WebSocket`/`global.MozWebSocket` once, at module
    // top-level - before app code has had a chance to install a native
    // `global.WebSocket` polyfill (`@valor/nativescript-websockets`), since
    // this module ends up in the same eagerly-evaluated vendor chunk as
    // whatever eagerly imports `socket.io-client`. Re-resolving inside the
    // `WS` constructor instead defers the lookup to when a real connection
    // is actually attempted, well after app boot (and the polyfill install)
    // has completed.
    //
    // The `from` text below matches this file's shape *after* it's already
    // passed through `@rollup/plugin-babel` (ember-native's `vite.config.js`
    // registers `babel()` before this plugin, and its `babel()` call has no
    // `exclude` for `node_modules`, so every `.js` file in the whole module
    // graph - this one included - gets re-parsed and re-printed by Babel
    // first) rather than this npm package's on-disk source: Babel's printer
    // drops the space in `function WS (opts)` and the redundant parens
    // around `(opts && opts.forceBase64)`, so matching the raw upstream
    // source text (as an earlier version of this patch did) never finds a
    // hit here, even though the dependency itself hasn't changed.
    match: /[\\/]engine\.io-client[\\/]lib[\\/]transports[\\/]websocket\.js$/,
    apply(code, id) {
      code = replaceOnce(
        code,
        id,
        'function WS(opts) {\n  var forceBase64 = opts && opts.forceBase64;',
        'function WS(opts) {\n  BrowserWebSocket = global.WebSocket || global.MozWebSocket;\n  var forceBase64 = opts && opts.forceBase64;',
      );
      return replaceOnce(
        code,
        id,
        '  if (!this.usingBrowserWebSocket) {\n    WebSocket = NodeWebSocket;\n  }\n  Transport.call(this, opts);',
        '  WebSocket = this.usingBrowserWebSocket ? BrowserWebSocket : NodeWebSocket;\n  Transport.call(this, opts);',
      );
    },
  },
  {
    // @nativescript/core's globals/index.js does `import tslib from
    // 'tslib'` expecting a default export; under this pipeline's CJS
    // interop that default is sometimes just the whole namespace object
    // instead, so a subsequent `tslib.__extends(...)` etc. call throws.
    // Importing the namespace and unwrapping `.default` ourselves handles
    // both shapes.
    match: /[\\/]@nativescript[\\/]core[\\/]globals[\\/]index\.js$/,
    apply(code, id) {
      return replaceOnce(
        code,
        id,
        "import tslib from 'tslib';",
        "import * as _tslibNs from 'tslib';\nconst tslib = _tslibNs && _tslibNs.default ? _tslibNs.default : _tslibNs;",
      );
    },
  },
  {
    // Same default-export CJS interop issue as globals/index.js above, for
    // acorn's named `parse` export.
    match: /[\\/]@nativescript[\\/]core[\\/]ui[\\/]core[\\/]bindable[\\/]bindable-expressions\.js$/,
    apply(code, id) {
      return replaceOnce(
        code,
        id,
        "import { parse } from 'acorn';",
        'import * as acorn from \'acorn\';\nconst { parse } = acorn;',
      );
    },
  },
  {
    // Same default-export CJS interop issue as globals/index.js above, for
    // css-what's named `parse` export.
    match: /[\\/]@nativescript[\\/]core[\\/]ui[\\/]styling[\\/]css-selector\.js$/,
    apply(code, id) {
      return replaceOnce(
        code,
        id,
        "import { parse as convertToCSSWhatSelector } from 'css-what';",
        "import * as cssWhat from 'css-what';\nconst { parse: convertToCSSWhatSelector } = cssWhat;",
      );
    },
  },
  {
    // NativeScript's DOM shim doesn't implement a working `document.body` -
    // `supportErrorRecovery`'s error-recovery snapshot is web-only and
    // should just be skipped rather than crashing app boot on every launch.
    // `document.body` is a real accessor
    // (`DocumentNode.createElement`'s `Object.defineProperty(..., 'body',
    // { get() {...} })`) that itself throws the instant it's read, so the
    // guard has to survive that throw too, not just check for a falsy
    // value.
    match: /[\\/]ember-vite-hmr[\\/]dist[\\/]instance-initializers[\\/]vite-hot-reload\.js$/,
    apply(code, id) {
      return replaceOnce(
        code,
        id,
        'function supportErrorRecovery(appInstance) {\n  const bodyHtml = globalThis.document.body.cloneNode(true);',
        [
          'function supportErrorRecovery(appInstance) {',
          '  let body;',
          '  try {',
          '    body = globalThis.document?.body;',
          '  } catch (e) {',
          '    return;',
          '  }',
          '  if (!body) {',
          '    return;',
          '  }',
          '  const bodyHtml = globalThis.document.body.cloneNode(true);',
        ].join('\n'),
      );
    },
  },
];

// ember-vite-hmr's `hmr()` plugin factory (dist/lib/hmr.js) can't be fixed
// via a `transform` hook the way the patches above are: it's the *plugin
// itself* (`demo-app/vite.config.ts` does `import { hmr } from
// 'ember-vite-hmr'` and calls it directly), loaded and evaluated by Node's
// own module system when the Vite config file is imported - well before
// Rollup's build pipeline exists, let alone starts transforming modules.
// Unlike `dist/instance-initializers/vite-hot-reload.js` above (real app
// runtime code that ends up bundled into `bundle.mjs`), `transform` never
// sees this file's source at all, so a `match`/`apply` entry for it would be
// silently dead code.
//
// The actual bug: `hmr()`'s own `transform` hook unconditionally emits a
// `dynamic import('/ember-vite-hmr/virtual/component:...')` for every
// HMR-tracked component import, guarded only by a runtime
// `if (import.meta.hot) {...}` (dead in a `vite build`, since Vite replaces
// `import.meta.hot` with `undefined` for builds) - but Rollup still has to
// *resolve and load* every statically-discovered dynamic import while
// building the module graph, regardless of whether tree-shaking will later
// prove the code unreachable. `hmr()`'s own `resolveId` accepts that id
// unconditionally, but its `load` hook returns `null` for it whenever there's
// no live dev server (`server.transformRequest` needs one) - `null` means
// "not handled" to Rollup, so it falls through to the default file-system
// loader, which throws `ENOENT` trying to read a fake path off disk.
// `@nativescript/vite` never calls `configureServer` (its `build`/`test`
// commands always do a one-shot/watched `vite build`, never `vite dev`), so
// this fires on every real build.
//
// Fixed here instead, as a `load` hook on *our own* plugin: Rollup's
// `resolveId`/`load` hooks run in `enforce` bucket order (pre, then normal,
// then post) and stop at the first plugin that returns non-nullish: since
// this plugin has no `enforce` (normal bucket) and `hmr-plugin` is
// `enforce: 'post'`, ours always runs first for the same id. Returning a
// harmless stub module here for `!server` cases means `hmr-plugin`'s own
// `load` (which would return `null` anyway in that case) never even needs to
// run. The stub's content doesn't matter at runtime - the only code that
// reads it is behind the same dead `if (import.meta.hot)` guard.
function virtualHmrComponentPrefix() {
  return '/ember-vite-hmr/virtual/component:';
}

module.exports = function dependencySourcePatches() {
  let server;
  return {
    name: 'ember-native-dependency-source-patches',
    configureServer(s) {
      server = s;
    },
    transform(code, id) {
      for (const patch of patches) {
        if (patch.match.test(id)) {
          return { code: patch.apply(code, id), map: null };
        }
      }
      return null;
    },
    load(id) {
      if (!server && id.startsWith(virtualHmrComponentPrefix())) {
        return 'export default undefined;';
      }
      return null;
    },
  };
};
