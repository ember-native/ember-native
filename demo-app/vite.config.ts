import { createRequire } from 'node:module';
import { defineConfig, mergeConfig } from 'vite';
import { typescriptConfig } from '@nativescript/vite';
import { hmr } from 'ember-vite-hmr';
// eslint-disable-next-line import/no-unresolved
import configureEmberNativeVite from 'ember-native/utils/vite.config.js';

const require = createRequire(import.meta.url);

// `@nativescript/cli` invokes vite as `vite build ... -- --env.android` (or
// `--env.ios`/`--env.visionos`), which is how `@nativescript/vite`'s own
// `getCliFlags()` (`helpers/cli-flags.js`) determines platform - it reads
// everything after the literal `--` and strips the `--env.` prefix. We
// replicate that same minimal parsing here rather than deep-importing
// `@nativescript/vite`'s internal, non-exported helper module.
function getCliPlatform(): string | undefined {
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

// `@nativescript/vite`'s vendor-manifest optimization (only active when HMR
// is on - `hmrActive` in its own `baseConfig`, the CLI's own default for
// `debug`/`run`) pre-bundles every direct dependency (plus, via peer-dep
// traversal, some devDependencies too - e.g. `@glimmer/component`) into a
// separate chunk via a raw `esbuild.build()` call that has no knowledge of
// Embroider's virtual `@ember/*`/`@glimmer/*` module system or this app's
// Node-builtin browser polyfill aliases (both handled only by the plugins in
// `ember-native/utils/vite.config.js`, which this side pipeline never sees).
// Excluding *every* dependency here (rather than just these) also breaks
// dev boot: `@nativescript/vite`'s own root-placeholder mechanism (shown
// while the real bundle loads) resolves `@nativescript/core` synchronously
// through this same vendor registry, so it must stay vendor-bundled.
// This list is exactly the packages that fail to resolve here (verified by
// running `@nativescript/vite`'s vendor-bundle step against this package.json
// standalone) - real Ember/Embroider addons and packages that reach `@ember/*`
// virtual specifiers transitively, plus host-only tooling (chromedriver,
// selenium-webdriver, `@nativescript/unit-test-runner`) that pulls in Node
// builtins (`crypto`, `stream`, `net`, ...) this esbuild pass doesn't
// polyfill. Excluding them only forgoes this pre-bundling speed optimization
// for these specific packages - the actual HMR fast-refresh behavior comes
// entirely from `ember-vite-hmr`'s own `hmr()` plugin below, an unrelated
// pipeline unaffected by this.
if (!process.env.NS_VENDOR_EXCLUDE) {
  process.env.NS_VENDOR_EXCLUDE = [
    '@babel/runtime',
    'ember-native-devtools',
    'ember-source',
    'ember-native',
    '@ember/test-waiters',
    '@glimmer/component',
    'ember-modifier',
    'ember-compatibility-helpers',
    'tracked-built-ins',
    '@warp-drive/core',
    '@warp-drive/json-api',
    '@warp-drive/schema-record',
    'octokit',
    'chromedriver',
    'selenium-webdriver',
    '@nativescript/unit-test-runner',
  ].join(',');
}

export default defineConfig(({ mode }) => {
  const emberNativeConfig = configureEmberNativeVite();
  // ember-native's plugins (classicEmberSupport/ember/babel) go first so
  // their `enforce: 'pre'` resolver/template-tag plugins get first refusal
  // on resolving Ember specifiers, ahead of @nativescript/vite's own
  // resolver (see ember-native/utils/vite.config.js for why).
  const merged = mergeConfig(emberNativeConfig, typescriptConfig({ mode }));
  // @nativescript/vite's `baseConfig` (just invoked via `typescriptConfig`
  // above) already read `process.env.NS_HMR_HOST` to pick `merged.server.host`
  // - on Android that's `0.0.0.0` unless the env var was set, and that value
  // is now permanently baked into `merged`. Only *after* that point is it
  // safe to default `NS_HMR_HOST` here: `hmr/server/vite-plugin.js` re-reads
  // this same env var lazily, later, to pick the *client's* HMR websocket
  // host, but the dev server's actual bind address is `merged.server.host`,
  // frozen above. Setting `NS_HMR_HOST` any earlier (e.g. before this
  // `typescriptConfig()` call) would instead make the dev server itself try
  // to bind to that address - fine for a real LAN IP, but `10.0.2.2` isn't
  // one; it's only a NAT alias the Android emulator's guest OS maps to the
  // host's loopback, and the host has no such interface to bind
  // (`EADDRNOTAVAIL`).
  //
  // Without this, `hmr/server/vite-plugin.js`'s `guessLanHost()` picks the
  // dev machine's real LAN IP for the client's websocket URL whenever the
  // server is wildcard-bound (`0.0.0.0`, i.e. always on Android here), but
  // that IP is never in this app's Android `network_security_config.xml`
  // cleartext allowlist (only `10.0.2.2` is), so the HMR websocket connection
  // is always rejected. Default it to `10.0.2.2` to match what the network
  // security config actually allows - only for Android, since iOS already
  // defaults to `localhost` (no cleartext restriction to work around) and
  // forcing `10.0.2.2` there would break it instead.
  if (!process.env.NS_HMR_HOST && getCliPlatform() === 'android') {
    process.env.NS_HMR_HOST = '10.0.2.2';
  }
  // `mergeConfig` appends ember-native's `resolve.alias` entries (normalized
  // to array form) after @nativescript/vite's own, but Vite's alias
  // resolution is first-match-wins - move ours to the front so they can't be
  // shadowed by one of @nativescript/vite's broader platform-resolution
  // aliases (e.g. `packagePlatformAliases`'s catch-all `customResolver`).
  const aliases = merged.resolve!.alias as { find: string | RegExp; replacement: string }[];
  const emberNativeReplacements = new Set(
    (emberNativeConfig.resolve!.alias as { replacement: string }[]).map((a) => a.replacement),
  );
  const [ours, rest] = [
    aliases.filter((a) => emberNativeReplacements.has(a.replacement)),
    aliases.filter((a) => !emberNativeReplacements.has(a.replacement)),
  ];
  merged.resolve!.alias = [
    // `app/boot.js` (package.json's `main`, the only entry @nativescript/vite
    // ever builds) resolves this bare specifier statically - see boot.js's
    // own docstring for why the real/test entry split happens here instead
    // of a runtime branch or dynamic import inside one shared file.
    { find: 'demo-app-entry', replacement: require.resolve('./boot-app.js') },
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
    // them itself.
    { find: /^\/?@vite\/env/, replacement: `/@fs${require.resolve('vite/dist/client/env.mjs')}` },
    { find: /^\/?@vite\/client/, replacement: `/@fs${require.resolve('vite/dist/client/client.mjs')}` },
    ...ours,
    ...rest,
  ];
  return mergeConfig(merged, {
    resolve: { preserveSymlinks: false },
    // ember-vite-hmr's own plugin is `enforce: 'post'`, so it always runs
    // after the plugins above regardless of array position.
    plugins: [hmr()],
  });
});
