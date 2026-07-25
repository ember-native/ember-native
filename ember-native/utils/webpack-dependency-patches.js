const path = require('node:path');
const fs = require('node:fs');

/**
 * Build-time replacements for source edits that used to live in
 * `patches/@nativescript__core@9.0.20.patch` and
 * `patches/@nativescript__unit-test-runner.patch`, applied via `pnpm patch`
 * (mutating `node_modules`). Reproducing them here as a webpack loader keeps
 * `node_modules` untouched and the fix visible/reviewable in this repo.
 *
 * Each entry's `from`/`to` is the exact text a hunk of the removed patches
 * replaced. If an upstream release changes the matched source, the loader
 * throws instead of silently no-op'ing so a stale patch doesn't go unnoticed.
 */
const patches = [
  {
    // Was: patches/@nativescript__core@9.0.20.patch
    // `tslib`'s default export isn't reliably present under webpack's
    // ESM/CJS interop for this dependency graph; import the namespace and
    // fall back to it instead of relying on a synthesized default.
    match: /@nativescript[/\\]core[/\\]globals[/\\]index\.js$/,
    from: `import tslib from 'tslib';`,
    to: `import * as _tslibNs from 'tslib';\nconst tslib = _tslibNs && _tslibNs.default ? _tslibNs.default : _tslibNs;`,
  },
  {
    // Was: patches/@nativescript__core@9.0.20.patch
    // Same interop issue for `acorn`'s named `parse` export.
    match: /@nativescript[/\\]core[/\\]ui[/\\]core[/\\]bindable[/\\]bindable-expressions\.js$/,
    from: `import { parse } from 'acorn';`,
    to: `import * as acorn from 'acorn';\nconst { parse } = acorn;`,
  },
  {
    // Was: patches/@nativescript__core@9.0.20.patch
    // Same interop issue for `css-what`'s named `parse` export.
    match: /@nativescript[/\\]core[/\\]ui[/\\]styling[/\\]css-selector\.js$/,
    from: `import { parse as convertToCSSWhatSelector } from 'css-what';`,
    to: `import * as cssWhat from 'css-what';\nconst { parse: convertToCSSWhatSelector } = cssWhat;`,
  },
  {
    // Was: patches/@nativescript__unit-test-runner.patch
    // Prevent the karma broker's socket.io client from falling back to a
    // jsonp/reconnecting transport, which hangs instead of surfacing a
    // real connection error on-device.
    match: /@nativescript[/\\]unit-test-runner[/\\]app[/\\]main-view-model\.js$/,
    from: `io.connect(this.baseUrl, { forceBase64: true })`,
    to: `io.connect(this.baseUrl, { forceBase64: true, jsonp: false, reconnection: false })`,
  },
];

const combinedTest = new RegExp(
  patches.map((patch) => `(?:${patch.match.source})`).join('|'),
);

/**
 * `@nativescript/unit-test-runner`'s `app/main-view-model.js` does
 * `require('../config')` / `require('../socket.io')` unconditionally at
 * module scope, but neither file ships in the npm package - the NativeScript
 * CLI's `TestExecutionService` writes real ones to these exact paths, with
 * real karma connection info, before every `nativescript test` run (and
 * *before* it invokes webpack, so the real files are already on disk by the
 * time webpack resolves this module - see `test-execution-service.js`'s
 * `launchKarmaTests`). `nativescript build` (no test run) never writes them,
 * so a plain production build fails to resolve this module at all, since
 * `main-view-model.js` is unconditionally pulled in by `test-helper.ts`.
 *
 * Was: the two "new file" hunks in `patches/@nativescript__unit-test-runner.patch`,
 * which physically wrote placeholder copies of these files into
 * `node_modules` on every `pnpm install`. Reproduced here as virtual modules
 * instead, registered **only when the real file isn't already on disk** -
 * unlike a patch permanently sitting in `node_modules`, this can never shadow
 * the CLI's real, freshly-written config/socket.io content during an actual
 * test run.
 */
const FALLBACK_MODULES = [
  {
    packageRelativePath: 'config.js',
    content: 'module.exports = {};',
  },
  {
    packageRelativePath: 'socket.io.js',
    content: 'module.exports = {};',
  },
];

/**
 * @param {typeof import("@nativescript/webpack")} webpack
 */
module.exports = (webpack) => {
  webpack.chainWebpack((config) => {
    config.module
      .rule('ember-native-dependency-patches')
      .enforce('pre')
      .test(combinedTest)
      .use('ember-native-dependency-patches-loader')
      .loader(require.resolve('./webpack-dependency-patches-loader.js'));

    const unitTestRunnerDir = path.dirname(
      require.resolve('@nativescript/unit-test-runner/package.json'),
    );
    const missingFallbacks = FALLBACK_MODULES.filter(
      ({ packageRelativePath }) =>
        !fs.existsSync(path.join(unitTestRunnerDir, packageRelativePath)),
    );
    if (missingFallbacks.length > 0) {
      const WebpackVirtualModules = require('webpack-virtual-modules');
      const virtualModules = new WebpackVirtualModules();
      config
        .plugin('ember-native-dependency-patches-virtual-modules')
        .use(virtualModules);

      // `virtualModules.writeModule()` needs its compiler's `inputFileSystem`
      // to already be patched with a `_writeVirtualFile` method, which the
      // virtual-modules plugin itself only does inside its own
      // `afterEnvironment` hook tap, not synchronously in `apply()`.
      // Registering a second plugin here whose `apply()` adds its own
      // `afterEnvironment` tap guarantees our write runs after that patch is
      // in place - webpack calls a hook's taps in registration order, and
      // the virtual-modules plugin's `apply()` (and so its tap
      // registration) already ran by the time ours does, since webpack
      // applies a config's `plugins` array in registration order.
      config
        .plugin('ember-native-dependency-patches-virtual-modules-write')
        .use({
          apply(compiler) {
            compiler.hooks.afterEnvironment.tap(
              'EmberNativeDependencyPatches',
              () => {
                for (const {
                  packageRelativePath,
                  content,
                } of missingFallbacks) {
                  virtualModules.writeModule(
                    path.join(unitTestRunnerDir, packageRelativePath),
                    content,
                  );
                }
              },
            );
          },
        });
    }
  });
};

module.exports.patches = patches;
