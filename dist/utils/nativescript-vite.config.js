/**
 * Full NativeScript + Vite config for an ember-native app's `vite.config.ts`
 * (and, for apps with a separate Vite-only test bundler config, that config
 * too - pass no `hmr` there, see below).
 *
 * Wires up `@nativescript/vite`'s own `typescriptConfig()` together with
 * `./vite.config.js`'s `configureEmberNativeVite()`, plus the handful of
 * ordering fixes both need that every consuming app would otherwise have to
 * hand-roll (and re-derive the reasoning for) itself:
 *
 *   - re-sorts `resolve.alias` so ember-native's own entries (`@glimmer/env`,
 *     the `json-to-ast`/`qunit` ESM shims) can't be shadowed by
 *     `@nativescript/vite`'s own broader platform-resolution aliases;
 *   - aliases a fixed bare specifier (`ember-native-app-entry`) to
 *     `options.entry`, so a static `app/boot.js` dispatcher can select a
 *     different real entry file per Vite config without a runtime branch -
 *     see demo-app's own `app/boot.js` for a live example of that dispatcher;
 *   - (only when `options.hmr` is passed) defaults `NS_HMR_HOST` for the
 *     Android emulator and `NS_VENDOR_EXCLUDE` for a base set of
 *     Ember/Embroider packages that always break `@nativescript/vite`'s HMR
 *     vendor-bundle pre-optimization, and fixes `@vite/env`/`@vite/client`
 *     alias ordering so the dev-server's own client-injection can resolve.
 *
 * Deliberately does *not* `require('vite')` or `require('@nativescript/vite')`
 * itself - unlike `@embroider/vite`/`@rollup/plugin-*` (real `dependencies`
 * of this package, safe to own a specific version of), the exact `vite`
 * instance driving the dev server matters here (its HMR client/websocket
 * protocol must match whatever `@vite/client`/`@vite/env` get aliased to),
 * and pnpm's strict per-package `node_modules` means `require('vite')` from
 * *this* file wouldn't reliably resolve the consuming app's own copy anyway
 * (confirmed: it doesn't even resolve inside this monorepo, since this
 * package itself has no direct dependency on `vite`). Callers pass their own
 * imports through instead - see the usage example below.
 *
 * Usage in an app's `vite.config.ts`:
 *
 *   import { createRequire } from 'node:module';
 *   import { defineConfig, mergeConfig } from 'vite';
 *   import { typescriptConfig } from '@nativescript/vite';
 *   import { hmr } from 'ember-vite-hmr';
 *   import configureNativeScriptVite from 'ember-native/utils/nativescript-vite.config.js';
 *
 *   const require = createRequire(import.meta.url);
 *
 *   export default defineConfig(({ mode }) =>
 *     configureNativeScriptVite({
 *       mode,
 *       mergeConfig,
 *       typescriptConfig,
 *       hmr,
 *       require,
 *       entry: require.resolve('./boot-app.js'),
 *     }),
 *   );
 *
 * A one-shot bundler config (e.g. a Vite-only `nativescript test` config)
 * that never runs the dev server just omits `hmr`/`require`:
 *
 *   export default defineConfig(({ mode }) =>
 *     configureNativeScriptVite({
 *       mode,
 *       mergeConfig,
 *       typescriptConfig,
 *       entry: require.resolve('./boot-test.js'),
 *       plugins: [myTestOnlyPlugin()],
 *       extend: { define: { MY_FLAG: 'true' } },
 *     }),
 *   );
 *
 * @param {object} options
 * @param {string} options.mode - Vite's `mode`, forwarded to `options.typescriptConfig`.
 * @param {(base: object, override: object) => object} options.mergeConfig - the
 *   app's own `mergeConfig`, imported from `vite` (must be the exact same
 *   `vite` instance the CLI is running, so pass the app's own import through
 *   rather than re-importing it here).
 * @param {(args: { mode: string }) => object} options.typescriptConfig - the
 *   app's own `typescriptConfig`, imported from `@nativescript/vite`.
 * @param {string} options.entry - absolute path to the file that should run
 *   as the app's real entry point (e.g. `require.resolve('./boot-app.js')`
 *   in the caller).
 * @param {() => import('vite').Plugin} [options.hmr] - the app's own `hmr`
 *   export from `ember-vite-hmr`. Omit entirely to disable HMR - this also
 *   skips the `NS_HMR_HOST`/`NS_VENDOR_EXCLUDE` defaulting and the
 *   `@vite/env`/`@vite/client` alias fix below, none of which matter without
 *   a dev server.
 * @param {(id: string) => string} [options.require] - the app's own `require`
 *   (e.g. `createRequire(import.meta.url)`), used to resolve `vite`'s own
 *   client runtime files for the `@vite/env`/`@vite/client` alias fix.
 *   Required whenever `options.hmr` is passed.
 * @param {string} [options.hmrHost] - override the guessed HMR websocket host
 *   `ember-vite-hmr`'s client connects to. Only takes effect on Android (iOS
 *   already defaults to `localhost` correctly); ember-native's own default is
 *   `10.0.2.2`, the NAT alias the Android emulator maps to the host
 *   machine's loopback - override this for a real device or a LAN dev
 *   server (a real LAN IP).
 * @param {string[]} [options.vendorExclude] - extra package names appended to
 *   the default `NS_VENDOR_EXCLUDE` list (only takes effect when `options.hmr`
 *   is passed). Safe to over-list: excluding a package name your app doesn't
 *   actually depend on is a no-op.
 * @param {object} [options.babel] - forwarded to `configureEmberNativeVite()`.
 * @param {import('vite').Plugin[]} [options.plugins] - extra Vite plugins,
 *   appended after ember-native's own and (if enabled) HMR's.
 * @param {import('vite').UserConfig} [options.extend] - extra Vite config
 *   merged in last via `options.mergeConfig` - use this for anything not
 *   covered above (extra `resolve.alias` entries, `define`, `build`, ...).
 * @returns {import('vite').UserConfig}
 */
module.exports = function configureNativeScriptVite(options) {
  const configureEmberNativeVite = require('./vite.config.js');

  const { mode, mergeConfig, typescriptConfig, entry, hmr, require: appRequire } = options;

  if (!entry) {
    throw new Error(
      "configureNativeScriptVite: options.entry is required - pass the absolute path to your app's real entry file, e.g. require.resolve('./boot-app.js').",
    );
  }
  if (!mergeConfig || !typescriptConfig) {
    throw new Error(
      'configureNativeScriptVite: options.mergeConfig and options.typescriptConfig are required - pass your own imports from `vite` and `@nativescript/vite` through (see this file\'s usage example).',
    );
  }
  if (hmr && !appRequire) {
    throw new Error(
      'configureNativeScriptVite: options.require is required whenever options.hmr is passed (e.g. `createRequire(import.meta.url)`).',
    );
  }

  if (hmr) {
    // @nativescript/vite's vendor-manifest optimization (only active when
    // HMR is on) pre-bundles every direct dependency (plus, via peer-dep
    // traversal, some devDependencies too) into a separate chunk via a raw
    // `esbuild.build()` call that has no knowledge of Embroider's virtual
    // `@ember/*`/`@glimmer/*` module system or any Node-builtin browser
    // polyfill aliases (both handled only by `configureEmberNativeVite`'s own
    // plugins, which this side pipeline never sees) - these packages fail to
    // resolve there. Excluding a package here only forgoes this pre-bundling
    // speed optimization for it - the actual HMR fast-refresh behavior comes
    // entirely from `ember-vite-hmr`'s own `hmr()` plugin, an unrelated
    // pipeline unaffected by this. Excluding a name your app doesn't actually
    // depend on is a harmless no-op (`NS_VENDOR_EXCLUDE` just deletes
    // matching names from a set of candidates).
    if (!process.env.NS_VENDOR_EXCLUDE) {
      process.env.NS_VENDOR_EXCLUDE = [
        '@babel/runtime',
        'ember-source',
        'ember-native',
        '@ember/test-waiters',
        '@glimmer/component',
        'ember-modifier',
        'ember-compatibility-helpers',
        'tracked-built-ins',
        ...(options.vendorExclude || []),
      ].join(',');
    }
  }

  const emberNativeConfig = configureEmberNativeVite({ babel: options.babel });
  const merged = mergeConfig(emberNativeConfig, typescriptConfig({ mode }));

  if (hmr) {
    // `typescriptConfig()` above (@nativescript/vite's `baseConfig`) already
    // read `process.env.NS_HMR_HOST` to pick `merged.server.host` - on
    // Android that's `0.0.0.0` unless the env var was set, and that value is
    // now permanently baked into `merged`. Only *after* that point is it safe
    // to default `NS_HMR_HOST` here: `ember-vite-hmr`'s own plugin re-reads
    // this same env var lazily, later, to pick the *client's* HMR websocket
    // host, but the dev server's actual bind address is `merged.server.host`,
    // frozen above. Setting `NS_HMR_HOST` any earlier (e.g. before this
    // `typescriptConfig()` call) would instead make the dev server itself try
    // to bind to that address - fine for a real LAN IP, but `10.0.2.2` isn't
    // one; it's only a NAT alias the Android emulator's guest OS maps to the
    // host's loopback, and the host has no such interface to bind
    // (`EADDRNOTAVAIL`).
    //
    // Without this, `guessLanHost()` picks the dev machine's real LAN IP for
    // the client's websocket URL whenever the server is wildcard-bound
    // (`0.0.0.0`, i.e. always on Android here), but that IP is never in this
    // app's Android `network_security_config.xml` cleartext allowlist (only
    // `10.0.2.2` is), so the HMR websocket connection is always rejected.
    // Default it to `10.0.2.2` to match what the network security config
    // actually allows - only for Android, since iOS already defaults to
    // `localhost` (no cleartext restriction to work around) and forcing
    // `10.0.2.2` there would break it instead.
    if (!process.env.NS_HMR_HOST && getCliPlatform() === 'android') {
      process.env.NS_HMR_HOST = options.hmrHost || '10.0.2.2';
    }
  }

  // `mergeConfig` appends ember-native's `resolve.alias` entries (normalized
  // to array form) after @nativescript/vite's own, but Vite's alias
  // resolution is first-match-wins - move ours to the front so they can't be
  // shadowed by one of @nativescript/vite's broader platform-resolution
  // aliases (e.g. `packagePlatformAliases`'s catch-all `customResolver`).
  const aliases = merged.resolve.alias;
  const emberNativeReplacements = new Set(emberNativeConfig.resolve.alias.map((a) => a.replacement));
  const ours = aliases.filter((a) => emberNativeReplacements.has(a.replacement));
  const rest = aliases.filter((a) => !emberNativeReplacements.has(a.replacement));

  merged.resolve.alias = [
    // `app/boot.js` (package.json's `main`, the only entry @nativescript/vite
    // ever builds) resolves this bare specifier statically - see that file's
    // own docstring for why the real/test entry split happens here instead
    // of a runtime branch or dynamic import inside one shared file.
    { find: 'ember-native-app-entry', replacement: entry },
    // Vite itself defines aliases for these two ids (`@vite/env`/`@vite/client`
    // -> its own `dist/client/{env,client}.mjs`) so its dev-server client
    // injection (`vite:client-inject`, which every HMR-enabled module gets a
    // preamble importing) can resolve. But `mergeAlias` puts *user* aliases
    // before Vite's own in the combined list, and @nativescript/vite's own
    // `packagePlatformAliases` (folded into `rest` below) has a catch-all
    // `find: /^(@[^/]+\/[^@/]+|[^@/]+)$/` matching any bare specifier,
    // `@vite/env` included. Vite/Rollup's alias plugin resolves a match by
    // recursing with `skipSelf: true`, which skips the *entire* alias plugin
    // (all entries, both this one and Vite's own further down the same
    // list) - so once `packagePlatformAliases` matches first, Vite's own
    // `@vite/env`/`@vite/client` aliases never get a chance to run, and
    // `@vite/env` falls through to normal node_modules resolution, which
    // fails (no such npm package) with "Failed to resolve import
    // '@vite/env'", crashing every dev-server `transformRequest` call
    // (`ns-entry` boot then times out retrying). Redeclaring the exact same
    // two ids here - earlier in the list, and pointing at the exact same
    // real files Vite's own aliases would have - produces the same outcome
    // Vite intended, without needing `packagePlatformAliases` to special-case
    // them itself. Dev-server-only (only `vite:client-inject`'d modules ever
    // reference these), so skipped entirely when HMR is off.
    ...(hmr
      ? [
          { find: /^\/?@vite\/env/, replacement: `/@fs${appRequire.resolve('vite/dist/client/env.mjs')}` },
          { find: /^\/?@vite\/client/, replacement: `/@fs${appRequire.resolve('vite/dist/client/client.mjs')}` },
        ]
      : []),
    ...ours,
    ...rest,
  ];

  const withHmr = mergeConfig(merged, {
    resolve: { preserveSymlinks: false },
    // ember-vite-hmr's own plugin is `enforce: 'post'`, so it always runs
    // after the plugins above regardless of array position.
    plugins: [...(hmr ? [hmr()] : []), ...(options.plugins || [])],
  });

  return options.extend ? mergeConfig(withHmr, options.extend) : withHmr;
};

// `@nativescript/cli` invokes vite as `vite build ... -- --env.android` (or
// `--env.ios`/`--env.visionos`), which is how `@nativescript/vite`'s own
// `getCliFlags()` (`helpers/cli-flags.js`) determines platform - it reads
// everything after the literal `--` and strips the `--env.` prefix. We
// replicate that same minimal parsing here rather than deep-importing
// `@nativescript/vite`'s internal, non-exported helper module.
function getCliPlatform() {
  const dashIndex = process.argv.indexOf('--');
  if (dashIndex === -1) return undefined;
  for (const arg of process.argv.slice(dashIndex + 1)) {
    const [rawKey] = arg.replace(/^--env\./, '').split('=');
    if (rawKey === 'android' || rawKey === 'ios' || rawKey === 'visionos') {
      return rawKey;
    }
  }
  return undefined;
}
