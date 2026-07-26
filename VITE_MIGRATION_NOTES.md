# Vite migration notes (`@nativescript/webpack` → `@nativescript/vite`)

Technical reference for switching `demo-app`'s bundler from
`@nativescript/webpack` to `@nativescript/vite` (`nativescript` CLI 9.0.6,
`@nativescript/vite` 2.0.3, `@embroider/vite` 1.7.2). Read this before
touching the bundler setup again. As with `NATIVESCRIPT_UPGRADE_NOTES.md`,
almost every issue here is **silent**: `vite build` exits 0, the Gradle
build succeeds, and the app still crashes on-device with a generic,
cause-less error. **A green build proves nothing** - see the Prerequisite
section before trusting any change here.

## Current status

- `nativescript build android` / `nativescript debug android` (dev/debug
  mode): **verified working** on a real emulator (`Medium_Phone_API_33`,
  API 33) from a completely clean `platforms/` + `.ns-vite-build/` +
  `node_modules/.embroider/` state - real build, real install, real launch,
  real interaction (navigated into "List View", saw the RadListView/ListView
  content render). No stale build state involved.
- `nativescript build android --release`: **builds and boots without
  crashing** (all issues below are fixed there too), but does not get past
  the NativeScript launch screen to the app's actual content in the time
  observed (tens of seconds). This is a **different, not-yet-diagnosed
  issue** from everything else in this document - JS evaluation completes
  cleanly (`Ember : 6.12.0` prints, no exception, no "Module evaluation
  promise rejected") but the launch-screen-to-content transition
  (`Application.launchEvent` → `app.visit('/')` in `demo-app/app/boot.js`)
  doesn't visibly complete. Needs a follow-up investigation with more time
  than this pass had (e.g. instrument `boot()` in `app/boot.js` directly,
  check whether `Application.launchEvent` fires at all in release/optimized
  mode, check `nativescript-optimized` vs `nativescript-optimized-with-inspector`
  runtime differences beyond just the inspector globals already found below).
- `nativescript test android` / CI's `app-test.yml`: **confirmed this still
  requires `@nativescript/webpack`** (no equivalent exists in
  `@nativescript/vite`) and **verified working** on a real emulator via a
  second, webpack-only NativeScript config selected with `--config` - see
  "`nativescript test android` still requires webpack" below.
- Fine- and coarse-grained HMR (helpers/modifiers/components, and
  route/controller/template): **real HMR wired up in `demo-app` via the
  published `ember-vite-hmr` package**, replacing the addon's own
  vendored-but-dormant `vite-hot-reload.ts` service - see "HMR service"
  below.

## Why this was possible now

NativeScript 9.x ships a first-class, CLI-integrated Vite bundler
(`@nativescript/vite`; `nativescript` CLI ≥ 9.0.x reads a `bundler` field in
`nativescript.config.ts` and shells out to either `webpack` or `vite`
generically - see `lib/services/bundler/bundler-compiler-service.js` in the
`nativescript` package). Before this, NativeScript only understood webpack,
so this project's `ember-native/utils/embroider-webpack-adapter.js` existed
purely to bridge `@embroider/vite`'s Vite/Rollup plugins (`resolver()`,
`templateTag()`) into webpack's very different loader/plugin API by hand.
Once NativeScript can run a *real* Vite, `@embroider/vite`'s plugins can be
handed to it directly - none of that bridging code is needed for the Vite
path. It stays in the repo (`utils/webpack.config.js`,
`utils/embroider-webpack-adapter.js`, `utils/embroider-virtual-modules-plugin.js`,
`utils/embroider-template-tag-loader.js`) for apps that still build with
`@nativescript/webpack`; only `demo-app` moved to Vite. (`utils/hmr-loader.js`
*is* wired into `webpack.config.js`'s `gts/gjs`/`js/ts` rules (restored
alongside the rest of that file in the "`nativescript test android`" work
below) - it's the code it *injects* that's dead, not the wiring: it checks
`import.meta.hot`, which webpack never defines, so the injected branch never
runs. See "Still open" item 2.)

## The moving parts

- **`nativescript.config.ts`**: `bundler: 'vite'` + `bundlerConfigPath:
  'vite.config.ts'`. The only thing that tells the CLI to use Vite.
- **`demo-app/vite.config.ts`**: merges `@nativescript/vite`'s
  `typescriptConfig({ mode })` (NativeScript's own base config) with
  `ember-native/utils/vite.config.js` (the Ember/Embroider half:
  `classicEmberSupport()` + `ember()` from `@embroider/vite`, plus
  `@rollup/plugin-babel` for the existing `demo-app/babel.config.cjs`, plus
  the fixes below). Order matters: the Ember plugins are merged in *first*
  so Embroider's `enforce: 'pre'` resolver gets first refusal on resolving a
  given specifier, ahead of `@nativescript/vite`'s own resolver. The
  merged config also explicitly re-sorts `resolve.alias` (see "alias
  ordering" below) and sets `resolve.preserveSymlinks: false` (see
  "preserveSymlinks" below) - both *after* the two configs are merged,
  since `mergeConfig`'s own array-append semantics get these wrong by
  default.
- **`ember-native/utils/vite.config.js`** (new): the reusable
  Ember/Embroider-side Vite config, analogous to `utils/webpack.config.js`
  for the webpack path. Exports `configureEmberNativeVite(options)`.

## `preserveSymlinks: true` vs pnpm - the recurring root cause

`@nativescript/vite`'s own base config
(`@nativescript/vite/configuration/base.js`) hardcodes
`resolve.preserveSymlinks: true`, with no comment explaining why (plausibly
for `npm link`-style NativeScript plugin development, where you want a
linked plugin's own dependency resolution to happen from the *link
location*, not the real target directory). This is fundamentally
incompatible with how pnpm's virtual store works: a real npm dependency at
`node_modules/.pnpm/pkg@1.0.0/node_modules/pkg` gets its *own* peer
dependencies pre-resolved as sibling symlinks inside that same
`.pnpm/pkg@1.0.0/node_modules/` directory - real-path (`preserveSymlinks:
false`) resolution finds them there; symlink-preserving resolution instead
walks up from wherever the *symlink* sits (e.g. `demo-app/node_modules/pkg`)
and misses them entirely, since pnpm intentionally doesn't hoist arbitrary
transitive deps to `demo-app/node_modules`.

This produced multiple, distinct-looking failures that were all this one
root cause:

- `@glimmer/validator`'s real (non-ember-source-bundled) copy imports
  `@glimmer/global-context` as a peer - failed under `preserveSymlinks:
  true` with `[vite:load-fallback] Could not load @glimmer/global-context`.
- `@warp-drive/json-api` imports `fuse.js` - same failure shape.
- Both are resolvable fine with plain Node `require()` (which is real-path
  based by default), proving it's a Vite/esbuild-side resolution setting,
  not a genuinely-missing package.

**Fix**: `demo-app/vite.config.ts` explicitly overrides
`resolve.preserveSymlinks: false` in a config object merged in *after* both
halves are combined (`mergeConfig(merged, { resolve: { preserveSymlinks:
false } })`) - if you instead tried to set it inside
`configureEmberNativeVite()`'s returned config (the *first* argument to the
first `mergeConfig` call), `@nativescript/vite`'s `true` would win, since
`mergeConfig` prefers the second argument's scalar values.

**Caveat**: `demo-app/package.json` needed `loader.js` added as a direct
dependency (it's only a `peerDependency` of `ember-native`, and pnpm doesn't
create the same peer-injection symlinks for `link:`-protocol local
workspace packages that it does for real registry packages) - this was
already true and unrelated to the `preserveSymlinks` fix; don't revert it
if you ever flip `preserveSymlinks` back to `true` for some other reason,
since that's the one case this recurring bug class actually *needs*
`preserveSymlinks: true`-style resolution-from-the-symlink to work.

## `source-map-js` - a different, non-pnpm-specific resolution bug

Separately, `@nativescript/vite/helpers/commonjs-plugins.js` ships its own
compat shim for `css-tree`'s dependency on `source-map-js`
(`source-map-js-subpath-compat`, working around the exact same "acorn/
css-what/source-map-js ESM misclassification" family of bugs documented in
`NATIVESCRIPT_UPGRADE_NOTES.md`). Its `load()` hook returns a *virtual*
module (`\0source-map-generator-virtual`) whose own body does `import * as
sourceMapJs from 'source-map-js'` - but a virtual module has no real
on-disk `fromFile`, so bare-specifier resolution has no real directory to
walk up from, and even with `preserveSymlinks: false` this failed with
`[vite:load-fallback] Could not load source-map-js`.

**Fix**: added `public-hoist-pattern[]=source-map-js` to `.npmrc`, following
the same pattern already used for `ember-source`/`ember-primitives` -
hoisting it to the workspace root's real `node_modules/source-map-js` gives
every resolver (including one starting from a virtual module with no real
directory) a normal, findable path.

## `loader.js` - three different ways to get CJS/ESM interop wrong

`ember-native/src/setup.ts` needs the real `require`/`define` functions
from `loader.js` (the classic AMD loader shim `ember-source` depends on at
boot - see `NATIVESCRIPT_UPGRADE_NOTES.md` issue 7 for the
`registerBundlerModules` stub this interacts with). `loader.js` is a
classic v1 Ember addon (it contributes its content via `app.import()` in
its own `index.js`, not via being `import`ed) that has no exports field.
Getting a working reference to its `{ require, define }` object under
Vite/Rollup took three attempts:

1. **Bare specifier** (`import * as loader from 'loader.js'`): fails at
   *build* time with `Failed to resolve entry for package 'loader.js'`,
   because Embroider's compat adapter auto-upgrades v1 addons into a v2
   "rewritten package" with no `main`/`module`/`exports` entry (v1 addons
   aren't meant to be `import`ed directly - only consumed via their
   Broccoli tree contributions).
2. **Namespace import of the real file**
   (`import * as loader from 'loader.js/dist/loader/loader.js'`): builds
   fine, but *silently* breaks at runtime. `build.js` has no
   statically-detectable named exports (it's a CJS file doing
   `module.exports = { require, define }` inside a UMD factory function),
   so `@rollup/plugin-commonjs` can't verify `loader.require`/
   `loader.define` against a known export list - and instead of leaving
   them as real property lookups, Rollup **inlines each access as a literal
   `void 0`** with no build warning. `globalThis.requireModule =
   loader.require` compiles to `globalThis.requireModule = void 0`, and the
   crash only surfaces later, deep in `ember-native/src/setup-inspector-support.ts`,
   as a cause-less `globalThis.define is not a function`.
3. **Default import** (`import loaderModule from '...'`): also fails, but
   at *build* time this time - `"default" is not exported by
   .../loader.js/dist/loader/loader.js`. `build.js`'s internal nested
   `require()` calls (a vendored grapheme-splitter helper) put it in
   `@rollup/plugin-commonjs`'s lazy `"withRequireFunction"` mode, which only
   produces a real `default` export via a synthetic entry-proxy module that
   the plugin's own `resolveId` hook generates - but `@embroider/vite`'s
   resolver has `enforce: 'pre'` and always claims resolution first, so
   that proxy is never created (see the `json-to-ast` section below - same
   underlying mechanism).

**Fix** (what's actually in `ember-native/src/setup.ts` now): import the
`__require` named export directly - `import { __require as requireLoader }
from 'loader.js/dist/loader/loader.js'; const loader = requireLoader()`.
`@rollup/plugin-commonjs`'s `transform` hook always adds a real `__require`
export to a wrapped CJS module's *compiled output*, regardless of who
resolved the id or what import style was used elsewhere - so this
sidesteps the whole resolveId-ordering problem instead of depending on it.

**This one bit `nativescript test android` too** (see "still requires
webpack" below): `__require` only exists because of `@rollup/plugin-commonjs`;
webpack never synthesizes it, so the exact same import resolved to
`undefined` there, crashing with `(0, ...__require) is not a function`.
`setup.ts` now imports *both* forms - `import { __require as requireLoader }
from '...'; import * as loaderModule from '...'; const loader = requireLoader
? requireLoader() : loaderModule;` - and picks whichever one its actual
bundler populated. Webpack's namespace-import interop for a CJS module gives
a real object with genuine runtime property lookups (`.require`/`.define`
aren't statically inlined the way Rollup does it), so the fallback branch
resolves correctly. This has to be a *namespace* import, not the *default*
import attempt #3 above already ruled out: even though `loaderModule` is
only ever read when `requireLoader` is falsy (webpack), Rollup still
statically resolves every import declaration it sees regardless of which
runtime branch is actually taken - a default import here hits the exact
`withRequireFunction` proxy problem from attempt #3 and fails Vite's build
outright with `"default" is not exported by .../loader.js` (confirmed by
trying it - `nativescript build android` broke immediately). A namespace
import doesn't have that failure mode; at worst its properties are silently
`undefined` if actually read, and this code only reads it when `webpack`,
not Vite/Rollup, is the active bundler.

**If you see `X is not a function` or `X is undefined` for something that's
supposed to come from a CJS package accessed via a namespace import**,
suspect this exact Rollup optimization first. It produces *zero* build
warnings and the failure surfaces arbitrarily far from the real cause.

## `json-to-ast` - the same `withRequireFunction` problem, but we don't control the import site

`@warp-drive/json-api/dist/index.js` does `import jsonToAst from
'json-to-ast'` (a plain default import, not something we authored). Same
root cause as loader.js's default-import attempt above: `json-to-ast`'s CJS
bundle needs commonjs's synthetic entry-proxy for a real `default` export,
and `@embroider/vite`'s `enforce: 'pre'` resolver claims resolution first,
so the proxy is never generated - fails at build time with `"default" is
not exported by json-to-ast/build.js`.

Since we don't control `@warp-drive/json-api`'s source, the fix is a
resolve alias pointing `json-to-ast` at a hand-written shim
(`ember-native/utils/json-to-ast-esm-shim.js`) that does the same
`__require`-based trick as the loader.js fix:
```js
import { __require } from 'json-to-ast/build.js';
export default __require();
```
**The alias must use a regex, not a plain string**: `{ find: 'json-to-ast',
replacement: ... }` also matches `json-to-ast/build.js` (Vite's string
aliases match subpaths too, appending the remainder), which would redirect
the shim's own subpath import right back at itself. Use `{ find:
/^json-to-ast$/, replacement: ... }` for an exact match only.

**Alias ordering also matters and isn't automatic**: `mergeConfig` appends
`ember-native/utils/vite.config.js`'s `resolve.alias` entries (normalized to
array form) *after* `@nativescript/vite`'s own, but Vite's alias resolution
is first-match-wins. `demo-app/vite.config.ts` explicitly re-sorts the
merged array (matching by `replacement` value) to move ours to the front,
so they can't be shadowed by one of `@nativescript/vite`'s own broader
platform-resolution aliases.

## `structuredClone` - a bare top-level global reference in `@warp-drive`

`@warp-drive`'s internal graph code does `const cp = structuredClone;` at
*module top level* (not lazily inside a function). The NativeScript Android
runtime's embedded V8 doesn't implement `structuredClone`, so this throws a
`ReferenceError` the moment that module evaluates.

The obvious fix - polyfilling `globalThis.structuredClone` from app code
(`ember-native/src/setup.ts` already does this defensively, and a
`demo-app/app/polyfills.ts` was tried too) - **does not work**, and this is
worth understanding generally, not just for this one symptom:
`@nativescript/vite`/`@embroider/vite` always emit a separate `vendor.mjs`
chunk that the app's own `bundle.mjs` **statically imports from** (its
first, hoisted statement). Real ES module semantics guarantee a module's
static import dependencies are fully evaluated before a single line of its
own body runs - there is no JS you can put in `bundle.mjs` (or anything it
imports) that runs *before* `vendor.mjs`, because `vendor.mjs` **is** one of
its dependencies. Any bare unguarded global reference in code that ends up
in the vendor chunk can only be fixed at or before the vendor chunk itself.

**Fix**: a genuine build-time text substitution, in
`ember-native/utils/vite.config.js`, using `@rollup/plugin-replace`:
```js
replace({
  preventAssignment: true,
  delimiters: ['(?<![_$a-zA-Z0-9\\xA0-\\uFFFF.])', '(?![_$a-zA-Z0-9\\xA0-\\uFFFF])(?!\\.)'],
  values: {
    structuredClone: '(globalThis.structuredClone || function (value) { return JSON.parse(JSON.stringify(value)); })',
  },
})
```
Every bare `structuredClone` reference becomes this fallback expression
*before* chunking/ordering is even relevant. Two things to get right if you
copy this pattern for another global:
- Vite's own `define` config can't express this: it's implemented via
  esbuild's `define`, which only accepts an identifier or a JS literal as
  the replacement value, not an arbitrary fallback expression - it throws
  `Invalid define value (must be an entity name or JS literal)`.
- The default `@rollup/plugin-replace` delimiters guard against matching
  `structuredClone.foo` (a *following* dot) but not `foo.structuredClone` (a
  *preceding* dot, i.e. an unrelated property of the same name) - without
  adding `.` to the negative lookbehind too, the replacement text's own
  `globalThis.structuredClone` reference gets recursively matched and
  mangled into invalid syntax (`globalThis.(globalThis.structuredClone ||
  ...)`).

## `console.debug` - same class of bug, simpler fix

Ember's own internals call `console.debug(...)` directly during
`Application.create()` (i.e. on every app boot) - the NativeScript Android
console global only implements `log`/`warn`/`error`. Unlike
`structuredClone`, this one *is* fixable with a plain top-level polyfill in
`ember-native/src/setup.ts` (`if (typeof console.debug === 'undefined')
{ console.debug = ... }`), because it's reached from `bundle.mjs`'s own
code path (via `Application.create()`), not from inside the eagerly-loaded
`vendor.mjs` dependency chunk. The general lesson: whether a "polyfill a
missing global from app code" fix works at all depends entirely on which
chunk the code needing the polyfill lands in relative to the chunk setting
it up - always verify on-device, don't assume by analogy.

## Test files got bundled into the production app - `staticAppPaths`

`app/test.js` / `app/tests/**` (this project's actual QUnit test
entry/suite - see `app/tests/test-helper.ts`) were getting eagerly imported
into **every** regular `nativescript build/debug android`, not just
`nativescript test android`, silently replacing the real app's UI with
`@nativescript/unit-test-runner`'s "Unit Test Runner" screen.

Root cause: NativeScript requires every native-facing file (pages, native
setup, *and* tests) to live under `app/`, unlike classic ember-cli's
convention of a separate top-level `tests/` directory. Embroider's
`getAppFiles()` (`@embroider/core/dist/src/virtual-entrypoint.js`) does a
raw `walk-sync` over the **entire** `app/` directory to build the
classic-resolver module registry every `app/app.js` build eagerly imports
(`Resolver.withModules(compatModules)`) - it has a small hardcoded ignore
list (`app.js`, `engine.js`, `assets`, `testem.js`, `node_modules`) but
nothing for `test.js`/`tests/`. Two important dead ends first:
- `EmberApp`'s `trees.app` (a Broccoli-level exclude via `broccoli-funnel`)
  has **no effect** here - `getAppFiles()` reads straight from the raw
  on-disk `app/` directory, bypassing the classic Broccoli pipeline
  entirely.
- Gating just the `runTestApp(...)` *call* at runtime doesn't help either:
  `@nativescript/vite` always sets Rollup's `inlineDynamicImports: true`
  (only 3 fixed output files - `bundle`/`vendor`/`runtime` - are ever
  loaded on device), so even a *dynamic* `import()` inside the gated
  branch still gets its target module's top-level code eagerly evaluated
  at app boot - proved empirically by wrapping the qunit/test-helpers
  imports in `import()` and watching the crash persist unchanged.

**Fix**: `demo-app/ember-cli-build.cjs` passes a third argument to
`compatBuild(app, buildOnce, { staticAppPaths: ['tests', 'test.js'] })`.
`staticAppPaths` is Embroider's supported mechanism for exactly this: paths
listed there are excluded from `otherAppFiles` (`@embroider/core/dist/src/app-files.js`)
on the assumption the app wires them up itself - which `app/test.js`
already does (its own `require.context` scan over `-test.*` files).
`nativescript test android` (a separate, not-yet-working path - see "still
open" below) is unaffected, since it doesn't go through this registry.

## `console.debug is not a function` in `setup-inspector-support.ts` - only in release builds

The above fixes were enough for `nativescript build/debug android`
(regular debug builds), but `--release` builds still crashed identically.
Bisected (see "Debugging technique" below) to
`@nativescript/core/debugger/webinspector-dom.js` - **third-party code, not
ember-native's own** - which applies a `@DomainDispatcher('DOM')` decorator
to a class **at its own module top level**:
```js
DOMDomainDebugger = __decorate([inspectorCommands.DomainDispatcher('DOM'), ...], DOMDomainDebugger);
```
`DomainDispatcher(domain)` returns `(klass) => __registerDomainDispatcher(domain, klass)`,
and `__decorate` calls that closure immediately - so merely **importing**
`@nativescript/core/debugger/webinspector-dom` (which
`ember-native/src/setup-inspector-support.ts` does at its own top level)
calls `__registerDomainDispatcher`, a native-injected global that only the
`"-with-inspector"` Android runtime variant provides. NativeScript's build
log shows exactly this distinction and easy to miss:
```
+ adding nativescript runtime package dependency: nativescript-optimized-with-inspector   # debug
+ adding nativescript runtime package dependency: nativescript-optimized                  # release
```
Release builds intentionally use the plain runtime, so
`__registerDomainDispatcher` genuinely doesn't exist there - this isn't a
Vite bug, it's ember-native's inspector-support code never having been
gated for release builds at all (plausibly this always crashed release
builds even under webpack and nobody had built an unsigned/debug-keystore
release APK to notice, since normal debug-signed testing never exercises
this).

Wrapping just the *call* to `setupInspectorSupport(ENV)` in try/catch
(`demo-app/app/native/setup-ember-native.ts`) is good practice (devtools
wiring should never be allowed to crash the real app) but **does not fix
this crash** - the throw happens at import time, before the call. The
import itself has to not happen in a release build.

**Fix**: gate the *import* with `import.meta.env.DEV` (Vite's build-time
constant - substituted before tree-shaking, so unlike a runtime condition
this lets Rollup prove the whole branch, including the import, is
unreachable dead code in a production build and remove it from the bundle
entirely, not just defer it at runtime):
```js
if (import.meta.env.DEV) {
  import('ember-native/setup-inspector-support').then(({ setupInspectorSupport }) => {
    try { setupInspectorSupport(ENV); } catch (e) { console.error(...); }
  });
}
```
Needed `/// <reference types="vite/client" />` added to
`demo-app/references.d.ts` for TypeScript to know about `import.meta.env`.

## Debugging technique: bisecting a crash inside `.ns-vite-build/*.mjs`

Every crash in this document surfaced as the exact same generic,
cause-less on-device error:
```
Cannot instantiate module .../app/bundle.mjs
Error: Module evaluation promise rejected: .../app/vendor.mjs
```
(or `bundle.mjs` directly, once `vendor.mjs` itself was clean). Neither
`adb logcat` nor the on-device error overlay ever names the real
underlying exception or a useful line number for these ("File:
(<unknown>:1:265)" is meaningless - it's the position inside the runtime's
generic `require()` wrapper, not the real code). This is a fundamentally
different debugging situation from `NATIVESCRIPT_UPGRADE_NOTES.md`'s
console.log-bisection technique, because these are ES modules loaded via a
native `import()` whose rejection reason isn't surfaced at all, not CJS
`require()` calls you can interleave logging into one at a time.

What actually worked, for both the (readable, unminified) dev build and the
(minified, single-line) release build:
1. Copy `.ns-vite-build/bundle.mjs` (or `vendor.mjs`) directly into
   `platforms/android/app/src/main/assets/app/`, edit it in place, and
   re-run **only** `./gradlew assembleDebug` (or `assembleRelease -Prelease
   -PksPath=... -PksPassword=... -Palias=... -Ppassword=...` - note these
   are the actual Gradle property names in `platforms/android/app/build.gradle`;
   the `nativescript build android --release --key-store-*` CLI flags are
   different names for the same thing). This takes ~20-30s per iteration
   instead of the ~3min full `nativescript build android` (which re-runs
   the whole Vite/Embroider prebuild pipeline unnecessarily for this).
2. Insert `console.log('checkpoint N')` at *known-safe* points - for the
   unminified dev build, lines matching `^(function|const|var|let|class|export)`
   are almost always real top-level statement boundaries; for the minified
   release build, track bracket/paren/bracket depth and string state
   character-by-character and only split on top-level `;` (a naive
   line-based approach doesn't work on single-line minified output, and a
   naive *unicode-unaware* depth tracker will get confused by regex
   literals and template interpolation - if checkpoints fire out of order
   or duplicate, suspect the tokenizer, not the app).
3. Binary-search which checkpoint stops firing to narrow the crash site,
   then read the surrounding code directly (a full source map round-trip
   wasn't necessary for any of the bugs found this pass).
4. Once a suspect line is found, wrap *just that statement* in
   `try { ... } catch (e) { console.log('FAILED', e.message, e.stack); }`
   and rebuild once more to get the real `Error.message` - this is what
   actually identified `console.debug is not a function` and
   `__registerDomainDispatcher is not defined` (as opposed to just knowing
   "something near line X throws").

**Always delete `.ns-vite-build/`, `tmp/`, `node_modules/.embroider/`, and
especially `platforms/` before trusting a "successful" build.** A stale
`platforms/android/app/src/main/assets/app/` directory from a previous
(possibly pre-migration, webpack-based) build will make Gradle's
`UP-TO-DATE` caching silently reuse old JS content instead of the real
current Vite output - several of the debugging dead-ends during this pass
came from re-testing against exactly this kind of stale state without
realizing it.

## A real, upstream `nativescript` CLI bug: `build`/`test` never copy the Vite output

Completely independent of anything above: a **truly clean** `platforms/`
directory (freshly created, never previously built) fails
`nativescript build android` at the Gradle/Static-Binding-Generator step
with:
```
Error executing Static Binding Generator: Couldn't find '.../sbg-bindings.txt' bindings input file.
```
because `platforms/android/app/src/main/assets/app/` ends up **completely
empty** (just `package.json`) even though the Vite build genuinely
succeeded and `.ns-vite-build/{bundle,vendor}.mjs` exist on disk. Traced to
`nativescript/lib/services/bundler/bundler-compiler-service.js`:
- `compileWithWatch` (used by `nativescript debug android`, i.e. the watch
  mode) listens for an IPC message from the vite child process
  (`@nativescript/vite/helpers/ns-cli-plugins.js`'s `cliPlugin`, whose
  `closeBundle()` hook does `process.send({ emittedFiles, ... })`) and only
  *then* calls `copyViteBundleToNative(distOutput, destDir)` to copy
  `.ns-vite-build` into the native project.
- `compileWithoutWatch` (used by `nativescript build android` **and**
  `nativescript test android`, i.e. every non-interactive invocation) never
  calls `copyViteBundleToNative` at all - it just waits for the vite child
  process to exit with code 0 and resolves.

This is a real gap in `nativescript`/`@nativescript/vite`'s own
integration (webpack never needed this: `@nativescript/webpack` writes
directly into the platform destination itself, so there was never anything
for the CLI to copy after the fact). It only went unnoticed here because a
`platforms/` directory that already had *some* content (even stale content
from before the migration) let Gradle's incremental caching quietly reuse
the old assets, masking the fact that nothing new was ever copied.

**Fix**: patched via `pnpm patch nativescript@9.0.6`
(`patches/nativescript@9.0.6.patch`, registered in the root `package.json`'s
`pnpm.patchedDependencies`, same mechanism as the existing
`@nativescript/core`/`@nativescript/unit-test-runner` patches) - added the
same `copyViteBundleToNative(distOutput, destDir)` call to
`compileWithoutWatch`'s `close` handler, gated on `this.getBundler() ===
'vite'`. If `nativescript`/`@nativescript/vite` fix this upstream in a
later version, this patch (and the version pin in
`pnpm.patchedDependencies`) needs to be dropped, not just left stacked on
top.

## What did NOT need to change

- `demo-app/babel.config.cjs` - picked up automatically by
  `@rollup/plugin-babel`'s default config-file discovery.
- `demo-app/ember-cli-build.cjs`'s use of `compatBuild(app, buildOnce)` -
  already written for `@embroider/vite` (predates this migration); only the
  third `staticAppPaths` argument was added.
- `ember-native/src/setup.ts`'s `registerBundlerModules` stub (see
  `NATIVESCRIPT_UPGRADE_NOTES.md` issue 7) - `@nativescript/vite`'s own
  `createBundlerContextPlugin` calls the *real* `global.registerBundlerModules`
  the same way webpack's `require.context`-based one did.
- Node built-in polyfill shims (`stream-browserify`, `https-browserify`,
  `buffer`, etc.) in `demo-app/package.json` - left in place un-audited;
  Vite's dependency graph never surfaced a need to remove them.

## HMR service (`ember-native-todo.md` sub-task 2, then superseded by real `ember-vite-hmr`)

`src/services/webpack-hot-reload.ts` +
`src/instance-initializers/webpack-hot-reload.ts` were renamed to
`vite-hot-reload.ts` as part of the `a134ee4` commit (demo-app's webpack →
vite switch) and made dual-mode rather than webpack-only (activation check
`Boolean(import.meta.hot) || (typeof module !== 'undefined' &&
Boolean(module.hot))`). This service implemented *coarse-grained* HMR only:
on a route/controller/template module replacement it clears the relevant
container caches and calls `router.refresh()`. It only ever activated in
response to `window.emberHotReloadPlugin.canAcceptNew()`/`.subscribe()`
calls, which came from nothing in the Vite path - so it was correct and
wired up, but permanently dormant (see the old "Still open" item 2, below,
for why).

**Superseded and removed** as part of installing `ember-vite-hmr` (the
published npm package, same author as this addon - `vite-hot-reload.ts` was
effectively an early, vendored prototype of exactly that package) into
`demo-app`:

- `ember-vite-hmr` ships its own `service:vite-hot-reload` +
  `instance-initializers/vite-hot-reload` + `instance-initializers/setup-hmr-manager`,
  auto-merged into any consuming app's tree the same way `ember-native`'s own
  `app-js` map works, the moment the package is a dependency - no per-app
  opt-in needed once it's installed. Its service is a strict superset of
  `ember-native`'s own: same container-cache-invalidation +
  `router.refresh()` logic, *plus* resolver patching for hot-versioned route
  names, error-recovery re-render on an unrecoverable Ember render error, and
  component/route/controller state preservation across reloads
  (`setup-hmr-manager.js`).
- Both services independently call
  `Object.defineProperty(this.router._router, '_routerMicrolib', {...})`
  with no `configurable: true` on the descriptor - having both active at
  once (i.e. leaving `ember-native`'s own service in place after adding
  `ember-vite-hmr` as a dependency) throws `TypeError: Cannot redefine
  property: _routerMicrolib` the moment the second one's instance-initializer
  runs, crashing app boot. `ember-native`'s copy had to go, not just become
  unused.
- Removed `src/services/vite-hot-reload.ts` +
  `src/instance-initializers/vite-hot-reload.ts`, and the corresponding
  `ember-addon.app-js` entries from `package.json`. No other code in this
  repo referenced `service:ember-native/vite-hot-reload` directly (confirmed
  via `grep -r vite-hot-reload`), so this has no in-repo blast radius beyond
  the addon's own public surface. Consuming apps that want HMR now depend on
  `ember-vite-hmr` directly, same as any other Ember app would.
- `ember-vite-hmr`'s usual activation path is a `transformIndexHtml`-injected
  `<script>` importing `ember-vite-hmr/setup-ember-hmr` (the module that
  actually creates `globalThis.emberHotReloadPlugin`) - NativeScript has no
  `index.html`, so that hook never fires. Fixed by importing
  `ember-vite-hmr/setup-ember-hmr` directly as the first line of
  `demo-app/app/boot.js`, ahead of everything else, so the global exists
  before Ember boots and `ember-vite-hmr`'s own instance-initializer looks it
  up. The module self-gates on `import.meta.hot`, so this import is a no-op
  (tree-shaken away entirely) outside dev/HMR builds - safe to import
  unconditionally rather than threading a mode check through `boot.js`.
- `demo-app/vite.config.ts` adds `ember-vite-hmr`'s `hmr()` plugin (its own
  `enforce: 'post'`, so array position relative to `ember-native`'s/
  `@nativescript/vite`'s plugins doesn't matter) and
  `demo-app/babel.config.cjs` now imports the babel plugin/template
  transform from `ember-vite-hmr/lib/babel-plugin` instead of
  `ember-native/utils/babel-plugin.js` (the vendored version's AST-rewrite
  format doesn't match what `ember-vite-hmr`'s own Vite `transform()` hook
  expects, so it's a swap, not an addition - both were mutually exclusive
  anyway, gated on different env vars that were never both true at once).
- `ember-native/utils/babel-plugin.ts` and `utils/hmr-loader.js` are
  untouched - they're still used by `demo-app/webpack.config.js`'s
  `nativescript test android` path (see "Still open" item 2). They don't
  conflict with `ember-vite-hmr` at all: entirely separate code, gated on
  a different env var (`EMBER_HMR_ENABLED`, only ever set in
  `webpack.config.js`), and their injected runtime check
  (`import.meta.hot`) never evaluates truthy under webpack regardless.

## `nativescript test android` still requires webpack (`ember-native-todo.md` sub-task 3)

Confirmed: `@nativescript/unit-test-runner` only wires up its test
entrypoint and karma integration through `@nativescript/webpack`'s hook
convention. Its `nativescript.webpack.js` (auto-loaded by
`@nativescript/webpack` from a dependency's package root) calls
`webpack.chainWebpack((config, env) => { if (env.unitTesting) {...} })` to
swap the whole `bundle` entry over to `test.ts`/`test.js`, prepend
`@nativescript/core/globals`/`bundle-entry-points`, unignore XML files under
both `app/tests/` and the runner's own
`node_modules/@nativescript/unit-test-runner`, and wire in coverage/AOT
tweaks. `env.unitTesting` comes from the `nativescript` CLI's own `test`
command (`TestCommandBase.execute` in
`nativescript/lib/commands/test.js`: `this.$options.env.unitTesting =
true;`), which then calls the same `run`/prepare/bundle pipeline as
`build`/`debug` - there's no separate "test bundler" concept at the CLI
level, just this one env flag. **`@nativescript/vite` has no equivalent at
all** - grepping its source (`node_modules/@nativescript/vite`) for
`unitTesting`/`karma`/`test.ts` turns up nothing. It doesn't know what a
test entrypoint is, so switching the whole project to `bundler: 'vite'` (as
`nativescript.config.ts` now does for `build`/`debug android`) makes
`nativescript test android` silently bundle the *regular app* instead of
the test harness - the CLI itself has no way to detect this and complain.

**Fix - a second, webpack-only NativeScript config used only for testing:**
- `demo-app/nativescript.test.config.ts` (new): the same fields as
  `nativescript.config.ts`, except `bundler: 'webpack'` and
  `bundlerConfigPath: 'webpack.config.js'`.
- `demo-app/webpack.config.js` (restored - deleted by the `a134ee4` vite
  switch): the same config already proven working for testing before that
  commit (see PR #393's commit message - "verified locally... 7/7 tests
  passing"), lightly cleaned of leftover debug `console.log`s.
- `demo-app/package.json`'s `test`/`debug-test` scripts and
  `.github/workflows/app-test.yml`'s "run tests" step now pass `--config
  nativescript.test.config.ts` explicitly. `build`/`debug android` keep
  using the default `nativescript.config.ts` (vite) - only `test android`
  opts into the webpack-only override.
- `@nativescript/webpack`/`babel-loader` devDependencies, dropped from
  `demo-app/package.json` by the vite switch, are back.

This works because the `nativescript` CLI's project config isn't a single
global file: `ProjectConfigService.detectProjectConfigs()`
(`nativescript/lib/services/project-config-service.js`) checks
`process.env.NATIVESCRIPT_CONFIG_NAME` / the `--config`/`-c` CLI flag
*before* falling back to `nativescript.config.ts`, and `getBundler()`
(`bundler-compiler-service.js`) re-reads `bundler`/`bundlerConfigPath` fresh
from whichever config resolves, on every command invocation - there's no
caching across CLI invocations to worry about.

Getting the actual test *run* green (not just the webpack build compiling)
surfaced two further bugs, both real and both independent of vite/webpack
per se, but only ever exercised via the now-restored webpack test path (it
was effectively dead/unbuilt between the vite switch and this pass):

1. **`ember-native/src/setup.ts`'s `loader.js` import didn't work under
   webpack** - see the addendum in the "`loader.js`" section above. Fixed
   there by falling back to a namespace import when the Rollup-only
   `__require` named export isn't populated.
2. **QUnit's own browser-environment auto-detection is fooled by
   `ember-native`'s DOM shim.** `app/test.js` imports
   `./native/setup-ember-native` (which calls `ember-native`'s `setup()`,
   installing `globalThis.window = globalThis` and `globalThis.document =
   new DocumentNode()` - the fake DOM Glimmer rendering needs, not a real
   browser DOM) before `./tests/test-helper` gets a chance to import
   `qunit`/`ember-qunit`. `qunit.js` runs two separate environment checks
   once, at its own module-load time:
   - An HTML-reporter bootstrap gated on `if (!window || !document)
     return;` ("don't load the HTML Reporter on non-browser
     environments") - with both already truthy, it proceeded and crashed
     with `TypeError: elem.addEventListener is not a function` the moment
     it tried to attach a real DOM listener to NativeScript's `globalThis`.
   - A separate `QUnit.urlParams` populator gated on `window &&
     window.location` alone. `ember-qunit`'s own bundled
     `qunit-configuration.js` unconditionally reads
     `QUnit.urlParams.devmode` right after import - so naively fixing the
     first bug (e.g. by just delaying `document`) trades it for `Cannot
     read properties of undefined (reading 'devmode')` instead.

   Fixed with a new `app/tests/qunit-browser-shim.js`, imported first
   (before the bare `qunit` package, which is imported before
   `./native/setup-ember-native`) in `app/test.js`: sets `globalThis.window
   = { location: {...} }` - enough to satisfy the `urlParams` populator -
   without setting `document`, so the HTML-reporter check still correctly
   reads this as a non-browser environment. `ember-native`'s `setup()`
   (imported right after) overwrites `window` with the real `globalThis`
   reference and adds `document` for the rest of the app/Ember/Glimmer
   rendering; qunit only reads these globals once, at its own import time,
   so it never notices the swap. **Import order in `app/test.js` is
   load-bearing** - read that file's own comment before reordering
   anything in it or in `app/tests/test-helper.ts`.

Verified end-to-end on a real Android emulator (`sdk_gphone64_arm64`, API
33) via `cd demo-app && npx nativescript test android --emulator --config
nativescript.test.config.ts`, from a fresh `adb uninstall` each time: real
webpack build, real Gradle build, real install, real app launch, real
karma/socket.io connection from the device back to the host, `TOTAL: 7
SUCCESS`, process exit code `0`.

**If you run this locally and it hangs forever after printing `TOTAL: 7
SUCCESS` instead of exiting** (or exits nonzero via a `TypeError: The "code"
argument must be of type number. Received type string ('SIGTERM')` coming
from `nativescript`'s `karma-execution.js`/`karma`'s `Server.close`), that's
`demo-app/karma.conf.js`'s `singleRun: process.env.CI` - karma only
self-terminates after a single run when `CI` is set, which GitHub Actions
always exports for every job but a local shell normally doesn't. Set
`CI=true` when reproducing this locally (`CI=true npx nativescript test
android --emulator --config nativescript.test.config.ts`); confirmed this
produces a clean `0` exit immediately after `TOTAL: 7 SUCCESS`, no hang and
no crash. This is existing, unrelated-to-this-migration behavior, not
something this pass changed.

## Publishing `utils/vite.config.js` for consuming apps, and keeping webpack (`ember-native-todo.md` sub-task 4)

`utils/vite.config.js` (added alongside the `a134ee4` demo-app switch, see
its own docstring for the plugin wiring and usage snippet) is already the
addon's public, documented entry point for consuming apps that want to
build with `@nativescript/vite` - it's exported via `package.json`'s
`"./utils/*": "./dist/utils/*"` wildcard exactly like
`utils/webpack.config.js` always has been, ships in `dist/` through the
normal `pnpm build` (`build:utils` compiles `utils/*.js`/`*.ts` with `tsc`),
and needs no separate opt-in. `demo-app/vite.config.ts` is a live example of
a consuming app importing and `mergeConfig`-ing it with
`@nativescript/vite`'s `typescriptConfig()`.

**Decision on `utils/webpack.config.js`: kept, not removed or hard-deprecated,
but documented as the legacy/backward-compat path** (see the docstrings now
on `utils/webpack.config.js` and `utils/embroider-webpack-adapter.js`). Two
reasons this isn't a straightforward "delete it, everyone moves to vite":

1. It is not just a convenience for apps slow to migrate - it is a *hard
   requirement* for `nativescript test android`, independent of what
   bundler an app's main build uses. As documented in the section above,
   `@nativescript/unit-test-runner` has no Vite integration at all, so even
   an app fully migrated to `@nativescript/vite` for `build`/`debug` (like
   `demo-app` itself) still needs `utils/webpack.config.js` wired up
   through a second, webpack-only NativeScript config for its test build.
   Removing the webpack path from the addon would break testing for every
   consuming app, not just the ones that haven't adopted Vite yet.
2. Apps that haven't upgraded their own build tooling to
   `@nativescript/vite` yet still need a working main-build path too. There
   is no forcing function to require that upgrade alongside an `ember-native`
   version bump.

Consuming-app guidance going forward: use `utils/vite.config.js` for new
apps and for the main `build`/`debug` flow of any app able to move off
`@nativescript/webpack`; keep `utils/webpack.config.js` around only for
`nativescript test android` (or for apps that haven't migrated their main
build yet). Both configs are maintained - `utils/webpack.config.js` isn't
frozen or unsupported, just no longer where new features land first.

## Still open (see `ember-native-todo.md` for the full breakdown)

1. **Release build launch-screen hang** (see "Current status" above) - JS
   evaluates cleanly with no exception, but the UI never visibly transitions
   past the NativeScript launch screen. Needs its own bisection pass.
2. **Resolved for Vite, left alone for webpack.** `ember-native/utils/hmr-loader.js`
   (a webpack *loader* that appends `canAcceptNew()` boilerplate to
   route/controller/template source) *is* wired into
   `demo-app/webpack.config.js`'s `gts/gjs`/`js/ts` rules (correcting an
   earlier version of this note, which claimed it was never referenced
   anywhere - true when first written, no longer true once sub-task 3
   restored `webpack.config.js` verbatim from its pre-migration state). But
   the code it *injects* checks `import.meta.hot`, which webpack never
   defines (webpack's equivalent is `import.meta.webpackHot`/`module.hot`),
   so the injected branch is permanently dead regardless of wiring - a
   real bug in the original implementation, not a wiring gap. Same story for
   `utils/babel-plugin.ts`, gated on `EMBER_HMR_ENABLED` (only ever set
   `true` in `webpack.config.js`) but otherwise inert.
   For the **Vite** path (`demo-app`'s main `build`/`debug android` flow),
   this is now moot: real fine- and coarse-grained HMR is wired up via the
   published `ember-vite-hmr` package instead of porting this addon's own
   dead code - see the "HMR service" section above. `utils/hmr-loader.js` /
   `utils/babel-plugin.ts` remain in the addon, unchanged, solely for the
   webpack test path; actually fixing their `import.meta.hot` bug for
   webpack (so `nativescript test android` gets working fine-grained HMR
   too) would be new, separate work - low value, since nobody interactively
   iterates against the test bundle.
3. If `nativescript`/`@nativescript/vite` ship a fix for the missing
   `copyViteBundleToNative` call in `compileWithoutWatch` (see above), drop
   `patches/nativescript@9.0.6.patch`.

## Prerequisite: verify on a real build, same as the NativeScript 9.x upgrade

Config-level success (`vite build` exiting 0, even a full `nativescript
build android` exiting 0) does not mean the app boots, and does not mean a
*previous* successful-looking run wasn't actually testing stale cached
output from before your change. Every time you touch this configuration:
```bash
cd demo-app
rm -rf node_modules/.embroider tmp .ns-vite-build platforms   # do not skip platforms/
npx nativescript build android
adb uninstall org.nativescript.embernativedemo
adb install platforms/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n org.nativescript.embernativedemo/com.tns.NativeScriptActivity
adb shell dumpsys activity activities | grep topResumedActivity   # NativeScriptActivity, not ErrorReportActivity
adb logcat -d --pid=<pid>   # or screencap -p to see the on-device error UI / real content
```

This applies just as much when switching *between* `nativescript build/debug android` (Vite) and `nativescript test android --config nativescript.test.config.ts` (webpack) on the same checkout, since both write into the same `platforms/android/app/src/main/assets/app/` - running one right after the other without wiping `platforms/` first was observed to produce a stale mix of `.mjs` (Vite) and `.js` (webpack) output that crashed on launch with `Failed to load component from module: bundle-app-root`, a *different* error from any of the ones documented above and unrelated to this migration's actual code changes (confirmed by re-running from a clean `platforms/` immediately after).

## `nativescript test android` with a Vite-only bundler (no webpack at all)

Sub-task 3 (above) concluded testing needed webpack because `@nativescript/vite`
has zero unit-test-runner/karma integration. That's still true, but it's
possible to build the *bespoke wiring* Vite needs instead of falling back to
webpack. This section documents that path: `demo-app/nativescript.test.vite.config.ts`
+ `demo-app/vite.test.config.ts` (+ `demo-app/vite-plugins/unit-test-runner-context.ts`),
selected via the new `test:vite`/`debug-test:vite` package.json scripts.
**Status: build + native Gradle/SBG build + install all verified working
end-to-end on a real emulator; app launch still crashes during `vendor.mjs`
module evaluation - not yet root-caused. See "Still open" at the end of this
section for exactly where to resume.**

### Why a whole second config, not just a flag

`@nativescript/webpack`'s `nativescript.webpack.js` hook swaps the whole
webpack `entry` over to `test.ts`/`test.js` when the CLI's `test` command
sets `env.unitTesting = true` - one config, two behaviors. `@nativescript/vite`
has no such hook: its `mainEntryPlugin` always builds whichever file
`demo-app/package.json`'s **`main`** field points to (not
`nativescript.config.ts`'s own `main` field, which vite ignores entirely),
with no override point. So the entry swap has to happen a different way:
`demo-app/app/boot.js` now branches at build time on a Vite `define`,
`__NS_UNIT_TESTING__`, set unconditionally `true` only by
`vite.test.config.ts`:
```js
if (typeof __NS_UNIT_TESTING__ !== 'undefined' && __NS_UNIT_TESTING__) {
  void import('./test.js');   // not awaited - nothing runs after in this file
} else {
  boot().then(() => { app.visit('/', {...}) });
  globalThis.app = app;
}
```
esbuild's `define` does real dead-code elimination for `if (false) {...}`,
including the dynamic `import()` inside it, so `./test.js`'s whole
qunit/ember-qunit/`@nativescript/unit-test-runner` dependency graph never
reaches the real app's production bundle - confirmed by inspecting
`.ns-vite-build/` output for a normal `vite.config.ts` build (no `test-*.mjs`
chunk present).

`nativescript.test.vite.config.ts` mirrors `nativescript.test.config.ts` but
with `bundler: 'vite'`, `bundlerConfigPath: 'vite.test.config.ts'`.

### `-- no-watch` is required (a real upstream bug, not a preference)

`nativescript test android`'s `TestCommandBase` defaults `$options.watch` to
`true` (same CLI option `debug`/`build` use), which routes the bundler
through `BundlerCompilerService.compileWithWatch` instead of
`compileWithoutWatch`. Under `@nativescript/vite`, this spawns
`vite build --watch`. **Observed, reproducible on this checkout: `vite build
--watch` never writes any files to `.ns-vite-build/` within the whole
lifetime of a `nativescript test android` run** (confirmed by waiting 3+
minutes past `✓ N modules transformed` with the output directory still
empty on disk, both through the full CLI flow and reproduced in isolation
by running `npx vite build --config vite.test.config.ts --mode development
--watch -- <same --env.* flags nativescript passes>` directly). Since
`@nativescript/vite`'s own IPC "build complete" message
(`ns-cli-plugins.js`'s `cliPlugin`) still fires (with `emittedFiles: []`),
`BundlerCompilerService.copyViteBundleToNative` copies from a directory
that's empty on disk, silently producing a native `assets/app/` with only
`package.json` in it - which then fails Gradle's Static Binding Generator
step with the exact same `Couldn't find 'sbg-bindings.txt'` symptom as the
already-documented "vite never copies its output" bug above, but from a
different, watch-mode-specific root cause. (A same-shaped size-stability
retry loop patched into `copyViteBundleToNative` was tried and *didn't*
help - the directory really does stay empty the whole time, not just
briefly - so this isn't a timing race worth papering over there; ruled out
and reverted.)

**Fix**: pass `--no-watch` (`demo-app/package.json`'s `test:vite`/
`debug-test:vite` scripts already do). This routes through
`compileWithoutWatch` instead, i.e. a plain non-watch `vite build`, which
*does* write real output (verified: `bundle.mjs` ~150KB, `vendor.mjs` ~5MB
with real content, both confirmed on disk after the build step) - the
already-existing `nativescript@9.0.6.patch` fix for `compileWithoutWatch`
(see the "real, upstream nativescript CLI bug" section above) then copies
it correctly, and the Gradle/SBG build succeeds. If `@nativescript/vite`
fixes `--watch` mode's file writing upstream, this flag could potentially
be dropped - but there's no interactive/HMR benefit to watch mode for a
one-shot test run anyway, so there's little reason to revisit even then.

### Rollup/CJS-interop build-time fixes (`demo-app/vite.test.config.ts`)

All discovered by iterating `npx vite build --config vite.test.config.ts
--mode development -- --env.unitTesting --env.android --env.appPath=app
--env.appResourcesPath=App_Resources` directly (much faster than the full
CLI per iteration) until it exits 0:

1. **`bufferutil`/`utf-8-validate`**: `ws` (a `socket.io-client` transitive
   dependency) does `require('bufferutil')`/`require('utf-8-validate')`
   inside a `try/catch`, meant to fall back to pure JS when these optional
   native addons aren't installed (they aren't - deliberately, NativeScript
   has no native Node addon support). `@rollup/plugin-commonjs` resolves
   `require(...)` calls statically at build time, so it hard-fails the
   whole build on the missing package instead of leaving a runtime
   `require` for that `try/catch` to actually catch. Fixed via
   `build.rollupOptions.external`.
2. **`generator-function`'s dual-package `exports` map**: pulled in
   transitively by the `util` Node-polyfill package (itself needed by the
   `socket.io-client` chain). Its `index.mjs` does `import
   getGeneratorFunction from './index.js'`, relying on Node's own CJS/ESM
   interop to synthesize a `default` export - Rollup's static analysis
   doesn't reproduce that here and fails the build ("default" is not
   exported by index.js). Fixed via a `resolve.alias` redirecting the bare
   `generator-function` specifier to the package's own plain-CJS
   `legacy.js` (its `main` field target, which Rollup's commonjs plugin
   converts correctly) - resolved as a real filesystem path (not
   `require.resolve('generator-function/legacy.js')`, which Node's own
   `exports` map enforcement rejects before Rollup ever sees it).
3. **Node built-in polyfills**: `ws`/`xmlhttprequest-ssl`/`debug` reference
   `fs`/`http`/`https`/`crypto`/`tty`/`os`/`net`/`tls`/`zlib`/
   `child_process`/`stream`/`url`/`querystring`/`buffer` (mostly inside
   feature-detection branches never actually taken on NativeScript).
   `@nativescript/vite`'s default handling for bare Node built-in
   specifiers ("externalized for browser compatibility") leaves them as
   literal unresolved `import 'fs'` etc. in the output - fine for a real
   browser target that just never executes that branch, but NativeScript's
   JS environment has no such module *at all*, so an eager top-level
   `import` of one crashes the entire `vendor.mjs` evaluation immediately
   (this was the fix for the *first* on-device crash found - see below for
   why it wasn't the only one). Fixed via `resolve.alias`, mirroring
   `webpack.config.js`'s existing `resolve.fallback` list: real polyfills
   (`stream-browserify`, `stream-http`, `https-browserify`, `url`,
   `querystring-es3`, `buffer` - all already `demo-app` devDependencies from
   the webpack era) for the ones webpack had real polyfills for; a small
   `demo-app/vite-plugins/empty-module.js` (`export default {};`) for the
   rest, since Vite's alias has no `false`-shorthand equivalent to
   webpack's `resolve.fallback: { x: false }`.
4. **`socket.io-client`'s own default export**: `import io from
   'socket.io-client'` fails ("default" is not exported) - the package does
   `module.exports = exports = lookup` and only *afterwards* mutates that
   function object with `exports.connect = ...` etc., which confuses
   `@rollup/plugin-commonjs`'s static default-export detection even though
   the identical file works fine required directly under webpack/Node.
   Fixed in the `@nativescript/unit-test-runner` pnpm patch (see next
   section) - `import * as socketIOModule from 'socket.io-client'; const io
   = socketIOModule.default || socketIOModule;` (namespace import, which
   doesn't require Rollup to statically prove a `default` binding exists).
   The same fix applies to the patch-added `config.js` (converted to a real
   ESM `export default` there, also namespace-imported defensively for the
   same reason) - **this one was flaky**: the exact same source passed
   under `vite build --watch` but failed under a plain `vite build` with
   supposedly-identical cached dep-optimization state, which is why both
   imports use the defensive namespace-import pattern rather than relying
   on the default import working "most of the time".

### `@nativescript/unit-test-runner`'s own webpack-only API usage (pnpm patch)

Extended `patches/@nativescript__unit-test-runner@4.0.1.patch` (previously
just the socket connect-options fix) - see the patch file for the literal
diffs, summarized here:

- **`app/main.js`, `app/bundle-app.js`**: both call `require.context("./",
  true, /.*\.(js|css|xml)/)` at module top level to self-register this
  package's own XML/JS/CSS into NativeScript's core module registry
  (`global.registerBundlerModules`) - `require.context` is webpack-only;
  under Vite, `require` is a dummy stub (`@nativescript/vite`'s main-entry
  polyfill: `function() { return {}; }`) with no `.context`. Guarded to
  skip when unavailable - the Vite-side replacement is
  `demo-app/vite-plugins/unit-test-runner-context.ts` (below).
- **`app/main-view-model.js`**: `require('../config')` /
  `require('../socket.io')` were real (non-`.context`) CJS requires that
  only ever resolved because webpack bundles them at compile time - under
  Vite's dummy `require` stub these silently returned `{}`, breaking both
  karma host/port discovery and the karma socket connection with no error
  at all. Fixed with real static imports (see point 4 above for why they're
  namespace imports specifically). `config.js` (a patch-added file, karma
  connection config auto-generated by `nativescript test init` against
  *this machine's* LAN IP at some point in the past - not something this
  pass touched beyond the export syntax) converted from `module.exports =
  {...}` to `export default {...}` to match.

### The eager-vs-lazy-import problem (the actual on-device crash, still open)

`demo-app/vite-plugins/unit-test-runner-context.ts` is the Vite-side
replacement for `@nativescript/unit-test-runner`'s own disabled
`require.context` call: it walks that package's `app/` directory (which
`@nativescript/vite`'s own `virtual:ns-bundler-context` - see
`configuration/typescript.js` - does *not* cover; that one's scoped to the
consuming app's own `app/` only) and builds a virtual module, injected into
`virtual:entry-with-polyfills` right after the `@nativescript/core/bundle-entry-points`
marker (same injection point `@nativescript/vite`'s own bundler-context
plugin uses), that imports and registers matching XML/CSS/JS files the same
way `registerBundlerModules` does.

The fundamental problem with this approach, discovered through on-device
bisection (see "Debugging technique" above for the checkpoint method - same
technique, reused here): **webpack's `require.context` gives a *lazy*
registry** - `context(moduleId)` only actually `require()`s (and thus only
actually *executes*) a matched file's top-level code the moment something
looks its moduleName up (e.g. `Frame` navigation) - but **a real static ESM
`import`, which is the only tool available for eagerly building a
Vite/Rollup virtual module, always evaluates immediately**, the instant
`vendor.mjs` itself loads - before *anything* in the app, including
`Application.run()`, has been called even once. Two concrete manifestations
found and fixed by excluding the offending files from eager import
(details/reasoning in the plugin's own comments):

1. `app.js`/`bundle-app.js`/`main.js` each call `Application.run(...)`
   themselves at module top level - none of the three are ever looked up by
   moduleName in this app's actual test flow, so excluding them from eager
   import is a straightforward, zero-cost fix.
2. `main-view-model.js` did `export var mainViewModel = new
   TestBrokerViewModel()` - a real, eager singleton whose constructor calls
   `Http.getString(...)` (via `KarmaHostResolver`), which needs a running
   `Application`/native Android context to not crash. Tried making its
   import *lazy via a dynamic `import()`* (triggered from
   `test-helper.ts`, well after `setApplication`) first - **this did not
   work**: even though a genuinely separate output chunk was produced,
   Rollup's own chunking still merged the singleton's actual code into the
   shared `vendor.mjs` chunk (evaluated eagerly) rather than the
   lazily-loaded chunk, since other, unrelated eager imports also reach the
   same file transitively-ish or Rollup's dedup heuristic decided so
   regardless - bisection confirmed the exact same crash, same
   `TestBrokerViewModel` code, still present in `vendor.mjs` after that
   change. **Real fix**: made the singleton lazy at the *language* level
   instead (a `getMainViewModel()` factory function, `main-view-model.js`'s
   three importers - `bundle-main-page.js`, `run-details.js`,
   `test-run-page.js` - and the fourth, unused-but-still-eagerly-walked
   `main-page.js`, all updated to call it instead of importing a
   pre-built value) - portable to either bundler's chunking behavior,
   since it no longer depends on *when* the module itself is evaluated,
   only on *when the function is called*.

**Still open**: after both fixes above, the on-device crash persists,
still reported as the same generic `Cannot instantiate module bundle.mjs /
Error: Module evaluation promise rejected: vendor.mjs` with no further
detail (see "Debugging technique" above for why `adb logcat`/the on-device
error overlay never name the real exception for this class of error).
Bisection (same checkpoint-insertion technique, `.ns-vite-build/vendor.mjs`
copied directly into `platforms/android/app/src/main/assets/app/` +
`./gradlew assembleDebug` + install + start, ~20-30s/iteration - do **not**
use the full `nativescript test android` CLI for this, it reruns the whole
~3min Vite build every time) has narrowed the crash to somewhere in the
range **lines 71649-72167 of a freshly-built `.ns-vite-build/vendor.mjs`**
(current checkout state) - the `stream-http`/`https-browserify`/
`xmlhttprequest-ssl` polyfill definitions (all `requireXxx()`-wrapped, i.e.
apparently lazy, per Rollup's standard commonjs-interop lazy-init pattern -
none of the checkpoint-inserted lines in this range are themselves inside
an unwrapped top-level statement that looks obviously unsafe on inspection,
which is what makes this one harder than the previous two).

**Important caveat for whoever continues this**: a `try { <region> } catch
(e) { console.log(...) }` wrap of this range - first the naive
line-picked version, then redone with a real brace/paren/bracket-depth
tracker (skipping strings/comments) to guarantee syntactically balanced
`try`/`catch` boundaries, covering generously past the bisected range
(lines 71426-72202) - **did not trigger the catch either time**, i.e. did
not reproduce/capture the crash at all despite covering the range the
checkpoint bisection pointed to. Since the checkpoint bisection also
produced at least one confirmed false negative earlier in this same
session (a checkpoint at the `class RootLayout extends RootLayoutBase`
line, part of unrelated `@nativescript/core` UI code, initially read as
"not reached" and was used to narrow the search, then on a later
re-check - prompted by exactly this kind of contradiction - turned out to
fire fine), **don't fully trust a single checkpoint result from this
technique in this codebase** - re-run any checkpoint that materially
changes the search direction at least once before trusting it. The
mismatch between "bisection says the crash is in this range" and "wrapping
that exact range in try/catch doesn't catch anything" was not resolved
before this pass ran out of time; it means either a checkpoint result
somewhere in the narrowing chain was another false negative/positive (most
likely - re-verify each step from scratch, in particular re-check whether
checkpoints inside lazy `requireXxx()` wrapper function bodies were
correctly interpreted as "not proof the function was ever called", only
"not proof it wasn't"), or the crash isn't a plain synchronous throw
reachable by wrapping textual regions at all (e.g. something evaluated via
`Function`/indirect `eval`, or generated dynamically). Next steps for
whoever picks this up:
1. Re-verify the 71649-72167 bisection result from scratch (re-run both
   boundary checkpoints again before trusting them) rather than assuming
   this pass's numbers are correct.
2. If reproducible, widen the balanced try/catch net further out in both
   directions - the whole `socket.io-client`/`engine.io-client`/`ws`/
   `xmlhttprequest-ssl` dependency cluster, roughly lines 60000-90000 in
   the current build - using the brace-depth-tracking approach (a naive
   line-picked wrap produced several `SyntaxError: Unexpected token
   'catch'` dead ends by cutting mid-function; a depth tracker that
   doesn't account for regex literals/template interpolation will produce
   *false* "balanced" points too - verify by actually attempting the
   build/install, not just by the tracker's own output).
3. **Already tried, did not help, but worth knowing**: a global
   `unhandledrejection`/`process.on('unhandledRejection', ...)` listener
   installed by prepending it to the very top of `vendor.mjs`'s text
   caught nothing either (no log output at all from the handler, not even
   confirmation it registered) - consistent with the failure being a
   genuinely *synchronous* throw during module evaluation/linking (native
   runtime wraps the whole thing in a promise per the ES module spec
   regardless), happening at a point V8/the native runtime's own module
   machinery handles before handing control to any of `vendor.mjs`'s own
   JS body code - which would also explain why textual try/catch wraps
   placed *inside* `vendor.mjs`'s body haven't caught it either, even ones
   bisection pointed at directly.
4. **Done, and this is the important lead to start from**: temporarily
   removing `unitTestRunnerContextPlugin()` from `vite.test.config.ts`'s
   `plugins` array entirely (i.e. no `@nativescript/unit-test-runner`
   content walked/eagerly registered at all - `vendor.mjs` drops from
   ~5.1MB to ~4.4MB) and rebuilding/redeploying via the fast
   `./gradlew assembleDebug` loop (**cleaning
   `platforms/android/app/src/main/assets/app/` completely and copying
   `.ns-vite-build/` fresh before rebuilding** - a first attempt at this
   diagnostic was contaminated by stale `.mjs` chunks left over in that
   directory from an earlier full-CLI run, which also has a *different*,
   easy-to-mistake-for-progress SBG symptom: `Error executing Static
   Binding Generator: File already exists ... NativeScriptActivity` -
   that's leftover duplicate `.java` bindings from stale chunks, not a
   real code problem; always `rm -rf platforms/android/app/src/main/assets/app`
   and re-copy fresh when testing this way) - **the exact same crash still
   happens**, byte-identical error message, with `unitTestRunnerContextPlugin()`
   entirely out of the picture. **This means every hour spent bisecting
   inside `unit-test-runner-context.ts`'s eagerly-walked content (points 1-3
   above, and the earlier "eager-vs-lazy-import" section) was chasing code
   that, while genuinely buggy and worth having fixed regardless, is not
   the actual crash.** The real cause is somewhere in what's left: `qunit`,
   `ember-qunit`, or `@nativescript/unit-test-runner`'s own `app/main.js`
   (still statically imported via `test-helper.ts`'s `import { runTestApp }
   from "@nativescript/unit-test-runner"` regardless of the plugin).
   Initially suspected `qunit.js`'s own UMD wrapper (takes
   `window`/`document`/`global` as *function parameters*, a common
   browser+Node dual-compat pattern, and its module-level
   `exportQUnit(QUnit2)` call branches on `window$1 && document2`) - **ruled
   out on inspection**: `requireQunit()` (the whole qunit module body,
   including `exportQUnit(QUnit2)`) is itself one of Rollup's standard
   lazy-init CJS-interop wrappers (`function requireQunit() { if
   (hasRequiredQunit) return qunit.exports; ...}`), and grepping every
   built `.mjs` file for actual *callers* of `requireQunit(` (as opposed to
   its own definition/`__name` registration) found none at all - the
   `test.js` chunk's own `import 'qunit'` (side-effect-only, no named
   binding) appears to have been dropped entirely rather than compiled into
   a call, plausibly because `qunit`'s `package.json` declares
   `"sideEffects": false` and Rollup's tree-shaking (`moduleSideEffects` in
   `@nativescript/vite`'s `base.js` defers to that when its own regex
   patterns don't match) took that at face value despite the real
   `window`/`document`-global side effects living inside. Whether or not
   that's *also* a real (separate, lower-priority) bug, it means qunit's
   own module body isn't what's crashing here - it's provably never
   invoked in this build at all.
   **Not yet checked, still on the list**: `ember-qunit` (its `dist` files
   produced many "X is not exported by qunit.js" warnings during the build
   - see point 4 in "Rollup/CJS-interop build-time fixes" above for why
   those didn't fail the *build*, but they're still worth checking for a
   *runtime* effect), `qunit-dom`, `@valor/nativescript-websockets`, and
   `@nativescript/unit-test-runner`'s own `app/main.js` (still statically
   imported via `test-helper.ts`'s `import { runTestApp } from
   "@nativescript/unit-test-runner"` regardless of the plugin - confirmed
   present in this diagnostic build's `test-*.mjs` chunk imports, aliased
   as `runTestApp`). The fastest path from here is the same fast
   gradlew-loop diagnostic used to rule out qunit: strip one candidate at a
   time (comment out its import, or - for `main.js` - temporarily stub
   `runTestApp` to a no-op) from `test-helper.ts`, rebuild just
   `vite.test.config.ts` (~3min), redeploy via the fast
   `./gradlew assembleDebug` loop (~20-30s), and check whether the crash
   signature changes - much faster than textual bisection inside an
   already-built bundle, which this pass spent considerable time on
   without a conclusive result (and which produced at least one confirmed
   false-negative checkpoint result along the way - see the caveat above).

### Follow-up (later in this same pass): confirmed it's `test.js`'s content, not the plugin or the Node-builtin aliases

Ran the "strip one candidate, rebuild, redeploy" plan from point 4 above
across several combinations (`plugins: [unitTestRunnerContextPlugin()]` in
or out; the `nodeBuiltinAliases` in or out; `app/test.js` replaced with a
single `console.log(...)` or left as the real file) - four full rebuild +
gradlew-loop cycles, results:

| `unitTestRunnerContextPlugin()` | `nodeBuiltinAliases` | `app/test.js` | Result |
|---|---|---|---|
| out | in | real | same `vendor.mjs` crash |
| in  | in | stubbed to one `console.log` | same `vendor.mjs` crash |
| out | out | stubbed to one `console.log` | **no crash** - `DIAGNOSTIC_TEST_JS_LOADED` logged, boot proceeds to a *different*, later, expected failure (`Failed to create JavaScript extend wrapper for class 'com/tns/NativeScriptActivity'` - expected, since a stubbed `test.js` never loads the Ember app graph that registers the Activity's JS extend, not a real bug) |
| in  | out (generator-function + `bufferutil`/`utf-8-validate` external only, needed for the build to succeed at all) | real | same `vendor.mjs` crash |

Row 3 is the only one that didn't crash, and it's the only one with
`app/test.js` stubbed out - rows 1 and 4 prove the crash happens with
`unitTestRunnerContextPlugin()` fully absent (row 1) *and* with the
`nodeBuiltinAliases` fully absent (row 4), as long as `test.js`'s real
content loads. **Conclusion: neither `unitTestRunnerContextPlugin()`'s
eagerly-registered content nor the `nodeBuiltinAliases`/`generator-function`
alias are the actual crash cause** - both are still correct, necessary
fixes (removing either breaks something else - the original "externalized
Node built-in" crash for the aliases, a real build failure for
generator-function/bufferutil), just not *this* bug. The initial suspicion
that landed on `qunit.js`'s own module body (see point 4's "not yet
checked" list) was investigated and ruled out on inspection (`requireQunit`
is never called anywhere in the built output - `import 'qunit'` appears to
have been dropped by Rollup's tree-shaking, likely because `qunit`'s
`package.json` declares `"sideEffects": false`) - but that inspection
predates this table and should be re-verified now that the real
conclusion is narrower: **the cause is somewhere in `app/test.js`'s actual
dependency graph** - `ember-qunit`, `qunit-dom`,
`@valor/nativescript-websockets` (+ its `bridge.android` import),
`ember-native`'s own `setup-ember-native`/`NativeElementNode`, or
`@nativescript/unit-test-runner`'s `app/main.js` (imported via
`test-helper.ts`'s `import { runTestApp } from
"@nativescript/unit-test-runner"` - present regardless of the plugin, and
not yet individually ruled out despite the guard patch making its
`require.context` call itself safe - something *else* in that file, or in
what it transitively imports, hasn't been checked in isolation).

**Update, same session, immediately after writing the table above**: took
this exact next step - `test-helper.ts` temporarily reduced to just
`import { runTestApp } from "@nativescript/unit-test-runner"; console.log('DIAGNOSTIC...')`.
**Still crashed, and the `console.log` never printed** - narrowing it to
`@nativescript/unit-test-runner`'s own `app/main.js` (the only thing that
import reaches) or something evaluated before it. Went one step further:
temporarily stripped `app/main.js` itself down to dropping its `./app.css`
import and the (already-guarded, so theoretically inert)
`require.context` block entirely, keeping only the `Application`/
`registerTestRunner` imports and a `console.log`. **Still crashed, console.log
still didn't print.** At this point it became clear the diagnostic itself
was compromised: `unitTestRunnerContextPlugin()` was still active in
`vite.test.config.ts` for both of these last two checks (only
`test.js`/`test-helper.ts`/`main.js` *content* was changed, not the plugin
list), and the plugin's injection into `virtual:entry-with-polyfills` is
*unconditional* - it runs regardless of what `test-helper.ts` ends up
importing. So every experiment in this update, unlike row 1 of the table
above, still had the *entire* `unitTestRunnerContextPlugin()`-injected
content (bundle-app-root.xml, run-details/test-run-page code, the
now-lazy-singleton `main-view-model.js`, `config.js`, `socket.io-client`,
etc.) present in `vendor.mjs` throughout. Combined with row 1 (plugin
*fully removed*, aliases in, real `test.js` → still crashed) and row 3
(plugin *and* aliases removed, `test.js` stubbed → no crash), the isolation
so far is genuinely contradictory on its own terms and **was not resolved
before this pass ran out of time** - all diagnostic edits (to
`vite.test.config.ts`, `app/test.js`, `app/tests/test-helper.ts`, and the
installed copy of `@nativescript/unit-test-runner/app/main.js`) were
reverted back to the real, intended versions before finishing up; none of
the diagnostic states were committed.

**Next session, start here** - the four-row table plus this update leave
exactly two variables not yet tested in isolation from each other:
`unitTestRunnerContextPlugin()` (present/absent) crossed with `test.js`'s
real content (present/stubbed), with the *aliases* held constant (in, since
they're needed for the build to succeed regardless). Run these two, freshly,
in order:
1. Plugin **present**, `test.js` **stubbed** to one `console.log` (not
   tried yet in this exact combination) - if this crashes, the plugin's
   *unconditionally-injected* content is implicated after all (contradicts
   the "ruled out" framing above, since that only tested plugin *absent*
   cases) and the next step is bisecting *inside* what the plugin injects
   by trimming `unit-test-runner-context.ts`'s file walk down file-by-file
   (start by excluding `.xml`/`.css` and keeping only `.js`, then the
   reverse, to split it further).
2. Plugin **absent**, `test.js` **stubbed**, but this time *without* also
   removing the `nodeBuiltinAliases`/`generator-function` alias (row 3
   removed both at once, conflating two variables) - if this crashes, the
   aliases (not the plugin) are implicated despite fixing a real, separate
   build-time issue, and the next step is auditing exactly which of the
   `nodeBuiltinAliases` entries (there are nine) is the problem by
   re-adding them one at a time.

**Update (following session): the queued plan above was run and resolved
the original mystery, then uncovered and fixed six more, separate real
bugs stacked behind it.** Step 1 of the plan (plugin present, `test.js`
stubbed) *did* crash - implicating the plugin's injected content, as
step 1's own note predicted. Bisecting inside `unitTestRunnerContextPlugin()`'s
file walk (js-only vs. xml/css-only, then excluding `main-view-model.js` +
its four importers specifically) narrowed it to `main-view-model.js`
itself - not `socket.io-client` (ruled out by aliasing it to the empty
module and confirming the crash persisted). From there, plain reading plus
one more targeted diagnostic (dumping `Object.keys()` of the resolved
`config`/`QUnit` objects at the actual crash site) found the real cause,
and five more of the same general shape further down the boot sequence
once this one stopped masking them. All are now fixed via `pnpm patch`
(new patches: `ember-qunit@9.0.4`, `@ember/test-waiters`,
`@ember/test-helpers`) plus two tracked `demo-app` file changes. In the
order they were hit (each one only became visible once the previous one
stopped crashing first):

1. **`config.js`'s CJS interop resolves to a *frozen* object, and
   `main-view-model.js`'s own code mutates it** (`patches/@nativescript__unit-test-runner@4.0.1.patch`).
   `import * as configModule from '../config'; const config =
   configModule.default || configModule;` - the `.default` fallback assumed
   Rollup would always synthesize a `default` export for this plain
   `module.exports = {...}`/`export default {...}` file. Instead, for this
   specific file, Rollup produces a *lazy* CJS-interop wrapper: a frozen
   namespace object exposing only a `__require()` accessor, no `default` at
   all. The `||` therefore falls through to the frozen wrapper itself, and
   `main-view-model.js`'s own `config.options = config.options || {}` /
   `config.ips = (...)` a few lines later throw
   (`TypeError: Cannot add property options, object is not extensible`-
   shaped, assigning to a frozen object in strict-mode ESM). Confirmed by
   dumping `Object.keys(QUnit3)`/similar mid-build to see the frozen
   wrapper's actual shape. **Fix**: replaced the fragile `.default ||`
   fallback with a `resolveCjsInterop()` helper that explicitly checks for
   `.default`, falls back to calling `.__require()` if that's a function,
   and only then falls back to the raw namespace - applied to both the
   `config` and `socket.io-client` resolutions in `main-view-model.js`.
   This is also the reason a *separately regenerated* `config.js` (the
   NativeScript CLI's own `test init`/karma-config bootstrapping
   overwrites this patch-added file with a fresh CJS
   `module.exports = {...}` version whenever the real CLI test flow runs,
   clobbering the patch's `export default` version) never mattered either
   way - the fix works regardless of which shape `config.js` is in at
   build time.
2. **`ember-qunit`'s own files hit the identical bug class importing
   `qunit` itself** (`patches/ember-qunit@9.0.4.patch`). `qunit.js`'s real
   CJS export (`module.exports = QUnit` - a whole external object of
   unknown-to-Rollup shape, assigned deep inside a nested `exportQUnit()`
   function, not a statically-traceable top-level assignment) defeats
   Rollup's export detection the same way `config.js` did, and all five of
   `ember-qunit`'s `dist/*.js` files (`qunit-configuration.js`,
   `test-isolation-validation.js`, `adapter.js`, `index.js`,
   `test-loader.js`) do `import * as QUnit from 'qunit';` then use
   `QUnit.config`/`QUnit.urlParams`/etc. directly - the exact same
   frozen-wrapper problem, at a fifth-away layer once fix 1 stopped masking
   it. **Fix**: same `resolveCjsInterop`-shaped rename-and-resolve pattern,
   applied per file (`import * as QUnit$ns from 'qunit'; const QUnit =
   QUnit$ns.config !== undefined ? QUnit$ns : (typeof QUnit$ns.__require
   === 'function' ? QUnit$ns.__require() : QUnit$ns);`).
3. **`QUnit.urlParams` is `undefined` outside a browser, and
   `qunit-configuration.js` dereferences it unconditionally** (same
   `ember-qunit` patch). `QUnit.config.testTimeout = QUnit.urlParams.devmode
   ? ... : ...` throws `TypeError: Cannot read properties of undefined
   (reading 'devmode')` once fix 2 correctly resolved `QUnit` itself -
   `qunit.js` only populates `urlParams` when it can parse a real
   `location.search`, which NativeScript has no equivalent of. **Fix**:
   `QUnit.urlParams && QUnit.urlParams.devmode`.
4. **qunit.js never becomes a global, and this repo's own `*-test.gts`
   files rely on the bare `QUnit` global (standard Ember-CLI convention -
   they don't import it)** (same `ember-qunit` patch).
   `basics-test.gts`/`list-view-test.gts`/`rad-list-view-test.gts` all
   reference `QUnit.module(...)`/`QUnit.test(...)` as a bare, undeclared
   identifier - in a real browser, `qunit.js`'s own `exportQUnit()` sets
   `window.QUnit = QUnit` so this "just works"; NativeScript has no
   `window`/`document` for that branch to ever trigger, so `QUnit` was a
   `ReferenceError` waiting to happen the moment these test files' own code
   ran (masked until fix 3, since nothing got that far before). **Fix**:
   added `globalThis.QUnit = QUnit;` right after resolving the real object
   in `qunit-configuration.js` (which is guaranteed to run, via
   `ember-qunit`'s own `index.js` importing it, before any test file does).
5. **`@ember/test-helpers`'s deprecation/warning query-param support
   assumes `document.location` exists** (`patches/@ember__test-helpers.patch`,
   both `dist/-internal/deprecations.js` and `dist/-internal/warnings.js`).
   `if (typeof URLSearchParams !== 'undefined') { const queryParams = new
   URLSearchParams(document.location.search.substring(1)); ... }` - guards
   the browser-only `URLSearchParams` global but not `document` itself
   (NativeScript's JS runtime happens to expose a real `URLSearchParams`
   built-in, so this branch *is* entered - a partial browser-API surface is
   almost worse than none, since the guard that would normally protect this
   looks sufficient but isn't). Real `ReferenceError: document is not
   defined`, at plain module-evaluation time (this file's whole body runs
   as a side effect of `@ember/test-helpers` being imported at all). **Fix**:
   `typeof URLSearchParams !== 'undefined' && typeof document !== 'undefined'
   && document.location`.
6. **`@ember/test-waiters`'s own `warn` import silently fails to link**
   (`patches/@ember__test-waiters.patch`). `import { warn } from
   '@ember/debug'; ... buildWaiter(name) { ... warn(...); ... }` - under
   this specific Vite/Rollup/embroider-vite pipeline, this named import
   resolves to nothing at all (not `undefined` - a genuine unbound
   identifier), while the real `@ember/debug` `warn` implementation is
   still present elsewhere in the same `vendor.mjs` bundle (as `_warn`/a
   renamed local) - a linking failure specific to this one import site, not
   a CJS-interop problem this time (`@ember/debug` is Ember's own package,
   already real ESM). Result: `ReferenceError: warn is not defined` the
   moment `buildWaiter("@ember/test-waiters:promise-waiter")` runs (an
   unconditional top-level call in this package, made for the two default
   waiters). Root cause not fully chased down (would need digging into why
   Rollup drops this one specific cross-module binding) - the pragmatic
   fix, matching the "defensive resolve, don't rely on the import working"
   pattern used throughout this pass: `import { warn as warn$imported }
   from '@ember/debug'; const warn = typeof warn$imported === 'function' ?
   warn$imported : function () {};` (a dev-only debug/logging helper, so a
   no-op fallback is safe).
7. **Vite's own `__vitePreload` dynamic-import helper assumes a real
   DOM** (`demo-app/app/boot.js`, not a patch - this is Vite-generated code
   inlined fresh into every build, not something in `node_modules`).
   Every real `import()` expression - including `boot.js`'s own `void
   import('./test.js')` - gets wrapped by Vite in `__vitePreload(() =>
   import(...), deps)`, which (when the target chunk has CSS dependencies
   to preload, which it does - `assets/vendor.css`) calls
   `document.getElementsByTagName(...)`/`.querySelector(...)`/
   `.createElement("link")`/`.head.appendChild(...)`, entirely unguarded.
   Tried `build.modulePreload: false` in `vite.test.config.ts` first - this
   does **not** suppress the wrapper (it only stops Vite injecting a real
   `<link rel=modulepreload>` browser polyfill script; kept anyway, since
   it's still correct to have it off for a non-browser target). Two
   distinct failures here, hit in sequence as each was fixed:
   - `document` itself doesn't exist yet at the point `__vitePreload` first
     runs (`ReferenceError: document is not defined`) - `ember-native`'s
     own `document` shim (from `./native/main`'s import graph) *does*
     eventually exist by the time `boot.js`'s own top-level code runs
     (confirmed - it's not a true "undefined" the way fix 5 was), so the
     fix is adding the specific missing methods (`getElementsByTagName`,
     `querySelector`, `head`) as no-ops directly onto it in `boot.js`,
     right after `const document = globalThis.document;` and before the
     `__NS_UNIT_TESTING__` branch that triggers the dynamic import.
   - `document.createElement` *does* already exist (it's `ember-native`'s
     real native-element factory, used throughout the app for actual
     `label`/`button`/etc. elements - so it can't be stubbed out wholesale)
     but throws `TypeError: No known component for element link.` when
     called with `"link"` (not a real NativeScript component). Fix: wrap
     it, falling through to a stub object only when the *real* factory
     throws, leaving real element creation completely untouched:
     ```js
     const nativeCreateElement = document.createElement.bind(document);
     document.createElement = (tagName) => {
       try { return nativeCreateElement(tagName); }
       catch (e) { return { setAttribute() {}, relList: undefined }; }
     };
     ```

After all seven fixes, the on-device symptom changed completely: no more
generic `Cannot instantiate module bundle.mjs` / `Module evaluation promise
rejected` at all. The JS side now runs cleanly through Ember's own boot
banner (`[DEBUG] DEBUG: Ember : 6.12.0` prints, confirming
`Application.create()` succeeded) and into the dynamically-imported
`test.js` chunk. **A new, different, and much later-stage failure remains,
not yet fixed:**

```
com.tns.NativeScriptException: Failed to create JavaScript extend wrapper
for class 'com/tns/NativeScriptActivity'
```

This reproduces consistently (not a cold-start flake - confirmed by
force-stopping and relaunching the already-installed APK twice more, same
result every time, and by a full from-scratch rebuild off the committed
patches alone, no leftover diagnostic state). Working theory, not yet
confirmed: `boot.js`'s dynamic `import('./test.js')` is genuinely
asynchronous (real ES dynamic `import()`, unlike webpack's
`require.context`-based synchronous loading of the equivalent code on the
webpack test path) and is deliberately **not awaited** (`void import(...)`
- see the comment already in `boot.js` explaining why). `@nativescript/unit-test-runner`'s
own `Application.run({ moduleName: "bundle-app-root" })` call - which is
what actually registers `NativeScriptActivity`'s JS-extend wrapper for a
*test* run (the normal `boot()` path in `boot.js`'s `else` branch, which
does register it, is entirely skipped in test mode) - lives deep inside
that same dynamically-imported chunk, reached only via `test-helper.ts`'s
own top-level `runTestApp({...})` call. If Android's native side tries to
instantiate `NativeScriptActivity` before that dynamic import's module
body has actually finished running, the JS-extend class doesn't exist yet
and this exact error results - a genuine architectural difference between
the sync (webpack) and async (Vite) test-entry mechanisms, not another
instance of the CJS-interop/browser-API-assumption bug class fixed above.
**Next steps for whoever picks this up**:
1. Confirm the timing-race theory directly: add a `console.log` immediately
   before and after the `import('./test.js')` call in `boot.js`, and
   another as the very first line of `test-helper.ts`, then check the
   logcat ordering relative to the "Failed to create JavaScript extend
   wrapper" exception - if the exception's timestamp falls between the
   "before" and "after"/`test-helper.ts`-start logs, the race is confirmed.
2. If confirmed, the real fix likely needs `Application.run(...)`'s
   moduleName registration to happen *before* Android tries to instantiate
   the Activity - options worth trying: (a) making `boot.js`'s dynamic
   import genuinely block app startup somehow (NativeScript's
   `Application.run` native call may have its own hook for this - check
   whether `create()`'s callback can itself be `async` and awaited by the
   native layer, or whether there's a documented way to defer Activity
   creation until a JS-side "ready" signal); (b) restructuring so the
   `moduleName`-registering call happens synchronously in `bundle.mjs`
   itself (not inside the dynamically-imported chunk) when
   `__NS_UNIT_TESTING__` is set, even though the qunit/ember-qunit/test
   *content* stays dynamically imported - i.e., split "register the
   Activity's moduleName" from "run the actual tests" into two separate
   steps with different sync/async requirements; (c) checking whether
   `@nativescript/vite`'s own generated entry has an `awaited`-dynamic-import
   variant, or whether top-level `await` in `boot.js` (NativeScript's own
   ESM loader concerns noted in the existing comment there) is actually
   safe to use for this one specific case despite the stated general
   preference against it.
3. Whichever fix lands, retest with `pnpm test:vite`/`debug-test:vite`
   (the full CLI flow, not just the fast `gradlew` loop) to confirm a real
   `TOTAL: N SUCCESS` QUnit run completes end-to-end before considering
   this task done or opening a PR - `ember-native-todo.md` explicitly
   flags this as the remaining gate.

## Follow-up session: three more real bugs fixed, one new blocker found (socket.io XHR hang)

Continuing from the "eager-vs-lazy-import problem" section above. Took
approach (b) from that section's next-steps list - split the shared
`boot.js` entry into separate real/test content files, selected per-Vite-config
instead of via a runtime branch - and along the way found two more real,
previously-undiscovered bugs specific to that split, plus a third,
unrelated bug in `@nativescript/vite` itself. All three are fixed. A fourth,
distinct problem (not an entry/bundling issue at all) was found immediately
after and is the new blocker - see its own subsection below.

### Fix 1: static per-config entry split (resolves the original race)

`demo-app/app/boot.js` is now a tiny, always-static dispatcher:
```js
import '@nativescript/core/ui/frame/activity.android.js?ns-keep'; // see Fix 3
import 'demo-app-entry';
```
`demo-app-entry` is a bare specifier aliased differently per Vite config -
`vite.config.ts` points it at `demo-app/boot-app.js` (the real app's old
`boot()`/`app.visit()` logic, moved verbatim), `vite.test.config.ts` points
it at `demo-app/boot-test.js` (a static `import './app/test.js'`, replacing
the old dynamic `import('./test.js')`). Both are plain static imports, so
whichever one is selected is evaluated synchronously as part of `boot.js`'s
own linking - this is what actually fixes the original
`Failed to create JavaScript extend wrapper for class
'com/tns/NativeScriptActivity'` race: `@nativescript/unit-test-runner`'s
`Application.run({ moduleName: "bundle-app-root" })` (reached synchronously
now, via `boot-test.js` -> `app/test.js` -> `app/tests/test-helper.ts`) runs
before Android ever gets a chance to try instantiating the Activity, instead
of after (dynamic import).

### Fix 2: `boot-app.js`/`boot-test.js` must live *outside* `app/`

First attempt put both new files under `app/` (next to `boot.js`, for
co-location). This reintroduced a *different*, previously-undiscovered bug:
Ember CLI's classic module-compat registry (`Resolver.withModules(...)`,
built from `compatModules` in the compiled output - needed for anything
still resolving modules by `<app-name>/whatever` string name) imports
*every* file under `app/` for its AMD-style namespace wrapper, completely
independently of the `demo-app-entry` alias or which Vite config is active.
With real content in both files instead of just `boot.js`'s dispatcher, this
registry was a second, separate static reference to each of them, with two
distinct consequences:
- **In test builds**: `boot-app.js`'s content (a real `NativeApplication.run({create: ...})`
  call) ran as a side effect of the registry scan, on top of `boot-test.js`'s
  test-runner-triggered `Application.run({ moduleName: ... })` - two
  `Application.run()`/`NativeApplication.run()` calls in the same process,
  reproducing the exact generic `Module evaluation promise rejected:
  .../bundle.mjs` crash class from earlier in this document. Bisected with
  the same checkpoint-`console.log` technique described above (see "Debugging
  technique" section) - checkpoints placed at top-level statement boundaries
  throughout `bundle.mjs` narrowed the crash to right after `boot-app.js`'s
  inlined `function boot() {...}`/`const document$1 = ...` content, which had
  no business being in a *test* bundle at all.
- **In the real production build**: the reverse problem - `boot-test.js`'s
  content (`import './app/test.js'`) got swept in too, pulling the entire
  qunit/ember-qunit/`@nativescript/unit-test-runner` dependency graph into
  the shipped app. Confirmed directly: a fresh `pnpm run build`'s
  `.ns-vite-build/bundle.mjs` contained a real, unconditional
  `runTestApp({...})` call and compiled `*-test.gts` assertion bodies
  (`assert.dom(this.element).containsText(...)`) - this had been true all
  along, undetected, because the *old* shared `boot.js`'s reference to
  `test.js` was behind a **dynamic** `import()`, which Rollup keeps in its
  own lazy chunk even when eagerly "imported" by the compat scanner; a
  **static** import doesn't get that protection and inlines eagerly no
  matter who imports it.

Fix: moved both files to `demo-app/boot-app.js` / `demo-app/boot-test.js`
(one level up, siblings of `vite.config.ts`) - outside Ember CLI's `app/`
tree entirely, so the classic-compat scanner (which only walks `appPath`)
never discovers them. `boot.js` itself must stay under `app/` (NativeScript's
`appPath`/`main` convention), but its only content is the bare-specifier
`import 'demo-app-entry'` dispatch - since ES modules memoize by resolved
path, the compat scanner *also* importing `boot.js` a second time is a
harmless no-op re-reference to the same already-evaluated module, not a
second execution.

**Gotcha this surfaced**: `demo-app/.gitignore` is an allowlist
(`*` then `!exceptions`), scoped to `app/**/*` plus a fixed list of root
files. Moving files to the `demo-app/` root silently made git stop tracking
them - added explicit `!boot-app.js`/`!boot-test.js` lines. Worth checking
this file again if any *other* new root-level file is ever added here.

### Fix 3: `@nativescript/vite`'s own Android Activity registration is racy without HMR

Even with fixes 1-2 in place, `nativescript test android`'s real on-device
run reproduced the *original* `Failed to create JavaScript extend wrapper`
crash one more time - a second, unrelated source of the same symptom.
`main-entry.js` (in `@nativescript/vite` itself, not our code) has two
completely different code paths for registering `NativeScriptActivity`'s
JS-extend wrapper on Android, chosen by `hmrActive = isDevMode &&
!!cliFlags.hmr` (both computed from the Vite `mode`/CLI flags the
`nativescript` CLI passes down - **not** from whether `ember-vite-hmr`'s
`hmr()` plugin happens to be in a project's own `vite.config.ts`, a
red herring this pass chased for a while before checking the actual
source): when `hmrActive`, it does a synchronous `require`-like call via
`__nsVendorRequire`; otherwise (the branch both `pnpm run build` and
`pnpm run test:vite` actually take here - neither passes `--hmr`), it does
a fire-and-forget, genuinely async `import('@nativescript/core/ui/frame/activity.android.js?ns-keep')`,
deferred to a `launchEvent` listener / `setTimeout(..., 0)`. This is an
inherent race against Android's own Activity-instantiation step, independent
of anything in this project's own code - empirically, the smaller production
bundle happened to consistently win that race (verified booting correctly
on-device, screenshot-checked - see below) while the larger test bundle
(qunit/ember-qunit/etc. still add real weight even after Fix 2) consistently
lost it.

Along the way, this also re-surfaced the `__vitePreload`/`document` bug
documented earlier in this file (`document.getElementsByTagName is not a
function`, this time inside `main-entry.js`'s own try/catch, logged as
`[ns-entry] failed to import android activity module` rather than crashing
outright) - re-added the same no-op DOM shims, but now in `boot-test.js`
specifically (not a shared `boot.js`), since production doesn't hit this
code path.

Neither of those shims fixes the *timing* race itself, though - only the
symptom of the deferred import throwing early. The actual fix: added a
**second, static** import of the same module to `boot.js` itself -
`import '@nativescript/core/ui/frame/activity.android.js?ns-keep';` (the
exact same specifier + `?ns-keep` query `main-entry.js` uses, so Rollup's
`preserve-imports.js` canonicalizes both references to the identical module
instead of tree-shaking this one away as unused - confirmed via a real
Rollup warning at build time: `activity.android.js is dynamically imported
by virtual:entry-with-polyfills but also statically imported by
app/boot.js, dynamic import will not move module into another chunk`).
This forces the class registration to happen synchronously, deterministically,
before any `setTimeout(0)` can fire - applies to both builds, not just the
racy one, removing the reliance on timing luck for production too.

**Verified**: fresh `pnpm run build` boots cleanly on-device (`topResumedActivity`
stays `NativeScriptActivity`, not `ErrorReportActivity`; screenshot showed
the real "Ember Nativescript Examples" list-view content, not a blank/error
screen). Fresh `pnpm run test:vite` (fast `gradlew` loop) also boots cleanly
now, reaching `NSUTR: found karma at 10.0.2.2` / `connecting to karma` -
the entire `Failed to create JavaScript extend wrapper` failure class,
across all three of its distinct root causes found across this and the
previous session, is now gone.

### New blocker: `socket.io-client`'s polling transport hangs, not a code/timing bug

With all three bugs above fixed, `nativescript test android`'s real
`pnpm test:vite` run gets *past* Activity creation and into
`TestBrokerViewModel.connectToKarma()` (`@nativescript/unit-test-runner/app/main-view-model.js`,
patched in `patches/@nativescript__unit-test-runner@4.0.1.patch`) - which
correctly discovers karma's host (`NSUTR: found karma at 10.0.2.2`) and
attempts `io.connect(...)` - then hangs and eventually reports
`NSUTR: socket.io error on connect: timeout`.

Ruled out, with direct on-device evidence (not just assumption):
- **Not network reachability**: `adb shell` on the emulator, using raw `nc`
  to send a manual HTTP GET for karma's actual socket.io polling endpoint
  (`GET /socket.io/?EIO=3&transport=polling HTTP/1.1` to `10.0.2.2:<port>`),
  gets an immediate, correct `200 OK` with a real engine.io handshake
  payload (`{"sid":"...","upgrades":["websocket"],...}`). The same URL from
  the host machine via `curl` responds identically and instantly.
- **Not a WebSocket-specific issue**: forcing `transports: ['polling']`
  (ruling out the `@valor/nativescript-websockets` bridge entirely) in a
  quick unpatched-source diagnostic still timed out identically - the
  `engine.io-client`-level `error` event fired with a bare `Error: timeout`
  (no further detail), not a `connect_error` from a failed upgrade attempt.
- **Not the earlier CJS-interop bug class**: `io.connect(...)` itself is
  reached and called (confirmed via a diagnostic `console.log` right before
  it, and `Object.keys(io)` showing a real `Manager`/`Socket`/`connect`
  shape) - the resolved `socket.io-client` module itself is fine.

Since a bare TCP+HTTP round-trip to the *exact same URL* from the exact
same device succeeds instantly, but `engine.io-client`'s own
`XMLHttpRequest`-based polling transport never completes (not even a
malformed-response error - a bare timeout, meaning the request itself
seemingly never resolves/rejects), the remaining suspects are specific to
how `engine.io-client`'s `polling-xhr` module constructs/drives its
`XMLHttpRequest` calls under NativeScript's own XHR implementation
(`@nativescript/core/globals`) - e.g. reliance on a `readystatechange`
sequence, `withCredentials`, or a synchronous-vs-async assumption that
doesn't hold here, even though the app's own `fetch()`-based `context.json`
request (a different code path) works fine. Not yet root-caused.

**Do not mark the vite-only test task done or open a PR yet** -
`ember-native-todo.md` (and `main-view-model.js`'s own patch comments)
explicitly gate that on a real `TOTAL: N SUCCESS` run, which this blocks.
**Next session, start here**:
1. Instrument `engine.io-client`'s `polling-xhr.js` (via a new pnpm patch,
   same pattern as the existing `ember-qunit`/`@ember/test-helpers` ones)
   directly - log every `XMLHttpRequest` lifecycle event
   (`onreadystatechange`, `onload`, `onerror`, `ontimeout`, the actual
   `readyState`/`status` values over time) around its `request()`/`poll()`
   methods to see whether the XHR ever fires *any* event at all, or is
   truly inert.
2. If it's truly inert, compare against how the *webpack* test path's own
   (already-verified-working, "`TOTAL: 7 SUCCESS`") socket connection
   manages this - same `socket.io-client@2.1.1` version, same
   `@nativescript/core` XHR implementation, so whatever differs is
   specific to the Vite/Rollup build output itself (e.g. a CJS-interop
   default-binding issue on `XMLHttpRequest` similar to the `config.js`/
   `qunit` ones fixed earlier, silently producing a non-functional stub).
3. Only once a real `TOTAL: N SUCCESS` run is confirmed via
   `pnpm test:vite` (the full CLI flow) should webpack actually be removed -
   `nativescript.test.config.ts`/`webpack.config.js`/the `@nativescript/webpack`
   and `babel-loader` devDependencies still need to stay until then, since
   they're `nativescript test android`'s only currently-working path.

## Follow-up session: switch the karma socket to WebSocket-only, skip XHR polling entirely

The previous session's next-steps plan (above) assumed the fix would be
inside `engine.io-client`'s XHR polling transport itself. It never got
there: forcing `transports: ['polling']` had already been tried (see above,
"not a WebSocket-specific issue") to rule out `@valor/nativescript-websockets`,
but the inverse - forcing `transports: ['websocket']`, i.e. skip polling's
XHR handshake *entirely* and connect straight over a real native WebSocket -
had not been. That's the actual fix, not XHR instrumentation.

- `engine.io-client@3.2.1`'s default `transports` option is `['polling',
  'websocket']` (`lib/socket.js:71`) - it always does an XHR polling
  handshake first regardless of WebSocket availability, only upgrading to
  WebSocket afterwards. Since the XHR polling handshake itself is what
  hangs (confirmed: raw TCP/HTTP to the same URL works instantly, the
  `engine.io-client`-level XHR never resolves), the fix is to skip polling
  outright: `patches/@nativescript__unit-test-runner@4.0.1.patch`'s
  `io.connect(...)` call now passes `transports: ['websocket']`.
- `engine.io-client`'s websocket transport module
  (`lib/transports/websocket.js`) resolves its WebSocket implementation via
  `var BrowserWebSocket = global.WebSocket || global.MozWebSocket;` at its
  own **module top level**, and (since `vite.config.js`'s `define: {window:
  'globalThis'}` makes `typeof window === 'undefined'` evaluate to `false`
  everywhere, including inside this dependency) never falls back to
  requiring the Node `ws` package either. So `global.WebSocket` has to
  already exist by the time this module first evaluates.
  `@valor/nativescript-websockets` (already an unused `demo-app`
  devDependency from an earlier, never-wired-in prep step) does exactly
  that as a side effect of being imported (`global.WebSocket = WebSocket`,
  a real native-socket-backed implementation, not an XHR polyfill) - added
  as the very first import in `boot-test.js`, ahead of `./app/test.js`, so
  ES module execution order guarantees it runs before `engine.io-client`'s
  websocket module (reached transitively through `test.js` →
  `test-helper.ts` → ... → `main-view-model.js`) ever loads.
- This avoids `XMLHttpRequest` entirely for the karma connection rather than
  trying to fix whatever is wrong with NativeScript's XHR implementation
  under this pipeline (still not root-caused, and no longer blocking -
  moot once nothing exercises it here).

**Verification status: implemented but not yet confirmed on-device.** A
`pnpm test:vite` run was started to verify this, but the Android emulator
(`emulator-5554`) wedged mid-session into an unkillable, uninterruptible
kernel state (`kill -9` had no effect, CPU time frozen) for reasons
unrelated to this change (a stale `test:vite` process from a prior session
was found still running against the same device and killed first, which
may or may not be related). A device-less `vite build --config
vite.test.config.ts` sanity check was tried as a fallback and failed, but
on an unrelated, expected-under-that-invocation error (`EISDIR` resolving
`@nativescript/core`'s `activity.android.js` platform file) - `@nativescript/vite`'s
platform-suffix resolution plugins are injected by the `nativescript` CLI
itself, not present in a bare `vite build`, so this is an artifact of
skipping the CLI wrapper, not a real regression. **Next session: once the
emulator is available again, this still needs a real `pnpm test:vite` run
reaching `TOTAL: N SUCCESS` before the "vite-only test path"/"fully remove
webpack" todo items can be marked done.**

## Follow-up session: reviewing patches for "can this be fixed with a global instead of a patch" (per `ember-native-todo.md`)

Audited every entry in `pnpm.patchedDependencies` for whether the same fix
could be achieved by setting up a global/environment shim in app code
instead of patching the dependency's own files. Conclusion: most can't -
they're genuine CJS/ESM interop or bundler-shape bugs, not environment gaps
- but two are a strong candidate for removal, not yet acted on because it
needs the same on-device verification the socket.io fix above does:

- **`@ember/test-helpers`, `@ember/test-waiters`**: both patches exist
  because `document.location` is `undefined` when their dist code checks
  `typeof URLSearchParams !== 'undefined'` (test-helpers) or does `import {
  warn } from '@ember/debug'` failing to link (test-waiters, unrelated -
  see below) at their own module top level. **But** `ember-native/src/setup.ts`'s
  `setup()` (called from `demo-app/app/native/setup-ember-native.ts:6`)
  already does `document.location = globalThis.window.location = { search:
  '', ... }` as a real side effect - and per `demo-app/app/test.js`'s
  import order (`qunit-browser-shim` → `qunit` → `setup-ember-native` →
  `test-helper`), that runs **before** `test-helper.ts`'s import of
  `ember-qunit`/`@ember/test-helpers` ever evaluates. If that ordering
  holds through Rollup's actual chunking (ES module evaluation order is a
  language-level guarantee, so it should), the *unpatched* `@ember/test-helpers`
  code should just work today - `document.location` already exists by the
  time it's checked. The `@ember/test-waiters` patch's `warn` fallback is a
  separate, real ESM-linking issue unrelated to `document.location` and
  would still be needed regardless.
  **Not yet removed**: this is a hypothesis based on static reading of the
  import graph, not a verified fact - removing a patch that's part of a
  currently-working test path without on-device confirmation would be
  reckless. Next session, with the emulator back: temporarily drop
  `@ember/test-helpers` from `pnpm.patchedDependencies` (keep
  `@ember/test-waiters`, editing only its `warn` fallback in), rerun `pnpm
  test:vite`, and only remove the patch file for real if it still passes.
- **`ember-qunit`** (all 5 files), **`@nativescript/core`**, **`log-symbols`**:
  all fix a different, structural problem - a CJS module's `module.exports
  = X` assignment happening inside a nested function call rather than a
  statically-traceable top-level assignment (`qunit`, `tslib`, `acorn`,
  `css-what`) or a genuinely-missing optional dependency
  (`is-unicode-supported`, a `nativescript` build-tool-side issue, not app
  runtime). Rollup's static CJS/ESM interop can't prove these safe to
  bind as a plain default/named export, so it produces a frozen namespace
  object with only a lazy `__require()` escape hatch. No global variable
  can fix this class of bug - it's about how Rollup *statically analyzes an
  import statement*, not about a missing runtime environment feature. The
  existing `resolveCjsInterop`/namespace-import-with-fallback pattern (also
  used in `@nativescript__unit-test-runner`'s own patch) is the right kind
  of fix; an alias to a hand-written ESM shim (the pattern `utils/json-to-ast-esm-shim.js`
  already uses for the same class of problem) is the other reasonable
  option, but isn't obviously simpler than what's there for 5 small files.
- **`nativescript@9.0.6`**: a genuine upstream CLI bug (`copyViteBundleToNative`
  never called on the non-watch path - see "A real, upstream `nativescript`
  CLI bug" section above). No environment shim in app code can reach into
  the `nativescript` CLI's own build orchestration; this can only be fixed
  by patching the CLI (or waiting for an upstream fix and dropping the
  patch + version pin).
- **`ember-vite-hmr@2.0.7`**: two independent fixes. The `!server` guard
  (skip HMR-only virtual-module rewriting when there's no dev server, i.e.
  every `nativescript build`/`test` one-shot build) is inherent to the
  difference between `vite dev` and `vite build` - not an environment gap.
  The `document.body` guard *is* arguably an environment gap - `ember-native`'s
  DOM shim never implements `document.body` since it's a web-only concept
  (cloning the whole page for error-recovery re-rendering). Giving
  `document` a stub `body` could avoid needing this patch line, but the
  underlying feature (web error-recovery re-rendering) still wouldn't work
  correctly on NativeScript even with a fake body, so skipping it outright
  (current behavior) is more correct than faking enough of a DOM to limp
  past the check - not changed.

## Follow-up session: does `@glimmer/env` really need a custom Vite alias?

Reviewed whether `utils/vite.config.js`'s `{ find: '@glimmer/env',
replacement: require.resolve('./glimmer-env.js') }` alias (mirrored in
`utils/webpack.config.js`) is actually necessary, per the premise that
"`@glimmer/env` should be resolved by embroider into ember-source, no
custom resolve should be needed." That premise doesn't hold up:

- `@glimmer/env` **is** a real, standalone npm package (`@glimmer/env@0.1.7`,
  a transitive dependency pulled in by `ember-source`/`@glimmer/*`), not
  something `@embroider/core` synthesizes content for. `@embroider/shared-internals`'s
  `emberVirtualPackages` set (which includes `@glimmer/env`) only affects
  one thing: `Resolver.reliablyResolvable()`'s dependency-declaration check
  (`module-resolver.js:1115-1126`), i.e. "don't complain that this import
  isn't a declared dependency." Its own comment says why: `@glimmer/env`
  imports are expected **to get compiled away by babel** (`babel-plugin-debug-macros`,
  wired in via `ember-cli-babel`/`@embroider/compat`'s `oldDebugMacros()`,
  which replaces `import { DEBUG, CI } from '@glimmer/env'` with inlined
  macro conditions) before any bundler needs to resolve the module for
  real - the `emberVirtualPackages` set exists only so a build tool
  scanning *pre-transpiled* code (its own words: "like snowpack") doesn't
  treat the bare specifier as a hard error while that's still true.
  Confirmed empirically that `ember-source`'s own published `dist/ember.debug.js`/`ember.prod.js`
  contain **no** raw `@glimmer/env` import - the real content is registered
  directly into Ember's classic AMD loader (`d('@glimmer/env', glimmerEnv)`),
  which is a runtime module registry, not something Vite/Rollup's static
  ESM resolution ever sees.
- So in the common case (first-party app/addon source, always babel-transformed
  by `demo-app/babel.config.cjs`'s `babelCompatSupport()` before Rollup
  resolves anything), the import is genuinely eliminated and no resolution
  ever happens - matching the premise.
- **But**: under this repo's specific pnpm layout, `@glimmer/env` is a real
  package that's only ever a *transitive* dependency (of `ember-source`,
  `@glimmer/component`, etc.) - pnpm's strict, non-hoisted `node_modules`
  never symlinks it into `demo-app/node_modules/@glimmer/`, since
  `demo-app` itself never declares it as a direct dependency. Confirmed
  empirically: `require.resolve('@glimmer/env')` run from `demo-app` throws
  `MODULE_NOT_FOUND` - plain Node/Vite module resolution genuinely cannot
  find this "virtual" package on disk here, regardless of what embroider's
  own dependency-validation logic permits. Vite's esbuild-based dependency
  pre-bundling/scan phase operates on raw, not-yet-babel-transformed source
  and can encounter the bare specifier before the real babel-based Rollup
  pipeline would have eliminated it - at which point pnpm's strict layout
  makes it a real, unresolvable-by-normal-means package, not just an
  embroider-blessed virtual one.
- **Conclusion: the alias should stay.** It's the correct, minimal fix for
  a real pnpm-strict-resolution gap that's specific to this package
  manager's layout, not a workaround for a bug in embroider or a
  redundant/unnecessary custom resolve. The one thing worth reconsidering
  (not changed this session, low priority): the alias's `glimmer-env.js`
  stub hardcodes `DEBUG = true`, `CI = false` unconditionally, which is
  only meaningful as a fallback for content that reaches the bundler
  already-compiled-but-unstripped - it doesn't (and structurally can't)
  vary with actual build mode the way babel's macro substitution does for
  first-party code. That's fine as a fallback (dev-only builds go through
  this path in practice), but isn't "production-accurate" if it were ever
  exercised in a release build - worth a comment update, not a behavior
  change.

## Follow-up session: socket.io fix verified, six more real bugs found and fixed, two genuine test failures remain

Picked up exactly where the previous session left off: the WebSocket-only
socket.io fix (`transports: ['websocket']` + `@valor/nativescript-websockets`)
was implemented but never verified on-device (emulator wedged mid-session).
This session got a real emulator, verified it, found it **didn't actually
work**, root-caused why, fixed that, and kept finding + fixing real bugs one
layer at a time until reaching `pnpm test:vite`'s first-ever real QUnit
execution (`Executed 7 of 7`) - **not yet a clean run**, two genuine
assertion failures remain. Do not remove webpack yet.

### The `ember-native-todo.md` prompt's specific questions, answered

- **"@glimmer/env should be resolved by embroider into ember-source... no
  custom resolve should be needed"**: investigated and disproved - see the
  previous session's own "does `@glimmer/env` really need a custom Vite
  alias?" section above. Short version: it's a real, pnpm-strict-resolution
  gap (the package is never hoisted into `demo-app/node_modules` since it's
  only ever a transitive dependency), not a redundant workaround. The alias
  stays.
- **"why is patch with `copyViteBundleToNative` needed?"**: covered in this
  file's "A real, upstream `nativescript` CLI bug" section (search for
  `copyViteBundleToNative` above) - `nativescript build`/`test`'s non-watch
  path never calls it, an upstream CLI bug, not fixable without patching the
  CLI itself.
- **"how does default vite setup work?"**: see this file's early sections
  covering `@embroider/vite`'s `ember()`/`classicEmberSupport()` plugins,
  `@nativescript/vite`'s platform-suffix resolution and `virtual:ns-bundler-context`
  module registry, and `utils/vite.config.js`'s alias list - the addon's own
  `utils/vite.config.js` is the single source of truth for what's
  NativeScript/embroider-specific vs. Vite's own defaults.
- **"review the patches and check if we can fix them without patching, e.g.
  setting up global vars"**: the previous session's patch audit stands for
  the packages it covered. This session found and fixed **two more real
  cases of this exact question**, with opposite answers:
  - `engine.io-client`'s `global.WebSocket` capture (below): the *existing*
    approach (relying on import order to set a global before a dependency's
    module evaluates) turned out to be unreliable, not fixable by
    *rearranging* globals/imports - the real fix was a small patch making
    the dependency re-resolve the global lazily, at call time instead of
    module-load time.
  - `engine.io-parser`'s bare `Buffer` reference, and `__vitePreload`'s bare
    `Event`/`dispatchEvent`/`document.*` calls (below): both **are** real
    environment gaps, fixed with globals/polyfills in `boot-test.js`, no
    patch needed.
- **"whats wrong with socket.io? XHR should not be used, but a native
  @valor/nativescript-websockets"**: XHR itself was never the deep problem
  (see "does `@glimmer/env`..." session's polling-vs-websocket writeup) -
  `transports: ['websocket']` + `@valor/nativescript-websockets` (already
  wired up, previous session) is the correct fix in principle, but had a
  *second*, independent bug hiding behind it (below) that made it look like
  it wasn't working at all.

### Bug 1: `engine.io-client`'s `global.WebSocket` capture happens too early, silently no-ops instead of connecting

The WebSocket-only fix from the previous session, run for real for the first
time this session, still hung and timed out identically to the old XHR
symptom - `NSUTR: socket.io error on connect: timeout`, even with
`global.WebSocket` confirmed present (`typeof global.WebSocket = function
WebSocket`) at the point `io.connect(...)` is actually called.

Root cause, confirmed by instrumenting `@valor/nativescript-websockets`'s
native bridge directly (`bridge.android.js`'s `connect()`/`onOpen`/`onFailure`
- temporarily, not part of the final fix): **none of those native bridge
methods were ever called at all**. `engine.io-client`'s websocket transport
module (`lib/transports/websocket.js`) does `var BrowserWebSocket =
global.WebSocket || global.MozWebSocket;` at its own module top level, and
that capture happens once, whenever the module first evaluates - not when a
connection is actually attempted. Confirmed via the built `vendor.mjs`
bundle: `@nativescript/unit-test-runner`'s vite-context plugin
(`unitTestRunnerContextPlugin`, see this file's earlier sections) eagerly
imports `main-view-model.js` - which eagerly imports `socket.io-client` at
its own module top level - from a point in the entry graph *before*
`boot-test.js`'s own `import '@valor/nativescript-websockets'` line runs,
despite that import being textually first in `boot-test.js`. Once
`BrowserWebSocket` is captured as `undefined`, `WS.prototype.check()`
(`!!WebSocket && ...`) returns false, `doOpen()` silently no-ops ("let probe
timeout"), and no WebSocket connection - real or fake - is ever attempted.
Import ordering can't fix this: it's not about *whether* the polyfill runs,
but about *when relative to a completely different, unrelated eager-import
path* it runs, which this app's own code has no control over.

**Fix**: `patches/engine.io-client@3.2.1.patch` (new) - re-resolves
`global.WebSocket`/`MozWebSocket` fresh inside `WS()`'s constructor (which
only ever runs at actual connection-attempt time, well after app boot),
instead of trusting the stale module-load-time snapshot. Verified via a
temporary native-bridge instrumentation pass (since reverted) that the real
`connect()`/`onOpen` calls now fire and a real WebSocket handshake completes
(`WSDIAG: onOpen called`, `NSUTR: successfully connected to karma`).

### Bug 2: `engine.io-parser`'s Node build references a bare `Buffer` global

With the socket actually connecting, the first outgoing packet crashed with
`ReferenceError: Buffer is not defined` inside `engine.io-parser`'s
`encodePacket`. `engine.io-parser@1.x` (pulled in by this old
`engine.io-client@3.2.1`) has a real `browser` package.json field
(`lib/browser.js`) but this Vite pipeline resolves its Node-oriented
`lib/index.js` instead (`@nativescript/vite` doesn't set a `browser`
resolve condition, since NativeScript isn't a real browser) - and that
version's `encodePacket` calls `Buffer.isBuffer(packet.data)`
unconditionally, even for plain string packets. Webpack shims a global
`Buffer` automatically via `node-libs-browser`; Vite doesn't.

**Fix**: a real environment gap, not a bundler-shape bug - polyfilled
directly in `boot-test.js` via the `buffer` npm package (already present as
an unused `demo-app` devDependency from an earlier prep step), using the
same `resolveCjsInterop`-shaped fallback (`.default` / `.__require()` /
namespace-itself) already established in
`patches/@nativescript__unit-test-runner@4.0.1.patch`, since Rollup can't
statically prove a safe binding for this package either.

### Bug 3: `test-root-view.xml` never registers under its bare module name under Vite

With the socket working, `Application.resetRootView({ moduleName:
'test-root-view' })` failed with `Failed to load component from module:
test-root-view`. Under webpack, `test-helper.ts`'s own local
`require.context('./', true, /.*\.(xml)/)` call is rooted at its own
directory (`app/tests/`), so `./test-root-view.xml` registers as the bare
nickname `test-root-view`. Vite's equivalent, `@nativescript/vite`'s
`virtual:ns-bundler-context`, walks the *whole* `app/` directory instead -
and `registerBundlerModules`'s own nickname-generation logic only strips a
leading `./` for `.js` files, keeping the full relative path (including
subdirectory and extension) for everything else - so
`app/tests/test-root-view.xml` only ever registers as `tests/test-root-view.xml`,
never the bare name the app's own test setup looks up.

**Fix**: register it a second time under the bare name directly in
`test-helper.ts`'s Vite branch, via `import.meta.glob('./test-root-view.xml',
{ eager: true, query: '?raw', import: 'default' })` + `global.registerModule('test-root-view.xml',
...)`. Note the registered key keeps the `.xml` extension even as a
"nickname" - `NativeScript`'s `ModuleNameResolver.getCandidates()` filters
candidates by `moduleName.endsWith(ext)`, so a bare `test-root-view` (no
extension) would never match a `.xml` lookup either.

### Bug 4: eager `import.meta.glob` for test-file discovery runs (and finishes) too early

Next: `Executed 0 of 0 SUCCESS` (via `require.context`'s Vite equivalent,
`import.meta.glob('./**/*-test.{ts,gts,js,gjs}', { eager: true })`, already
present in `test-helper.ts` from an earlier session). `{ eager: true }`
desugars into real static imports, hoisted to module top level and
evaluated the instant `test-helper.ts` first loads - which happens well
before karma-qunit's own adapter (loaded separately, asynchronously, via a
socket-delivered `eval script .../karma-qunit/lib/adapter.js`) has hooked
`QUnit.begin`/`testStart` to count specs. By the time it attaches, all four
test files' `QUnit.module`/`.test` registrations have already happened - too
early for the adapter to count them, though QUnit itself doesn't complain.
Webpack's `require.context(...).keys().map(tests)` is lazy for exactly this
reason: it only actually `require()`s (executes) each file once
`runTests()` itself is called, well after the adapter is ready.

**Fix**: drop `{ eager: true }` (giving a map of lazy loader functions) and
explicitly loop-and-`await` each one inside the `runTests()` callback,
matching webpack's laziness.

### Bug 5: an eager-but-unused `import.meta.glob` call gets tree-shaken away entirely

Making that loop `await testModules[key]()` for each matched file should
have been enough, but produced a *different* wrong result:
`Executed 0 of 0 SUCCESS` again, this time because **none of the four test
files' static imports were in the built bundle at all** - confirmed by
grepping `.ns-vite-build/bundle.mjs` for their filenames and finding
nothing (contrast with the *working* XML case just above, whose result was
assigned to a variable and read). Root cause: `import.meta.glob(...)` used
as a bare expression statement, its returned object never assigned to
anything, is indistinguishable from a dead expression to Rollup's
tree-shaking (`treeshake: true` by default) - it silently drops the whole
statement, and the static imports it desugars into, since nothing
observably depends on the result.

**Fix**: assign the glob's result to a variable and actually use it (here,
iterate its keys to build the `await` loop) - purely mechanical once
diagnosed, but easy to reintroduce by accident (a bare
`import.meta.glob(pattern, { eager: true })` statement looks completely
reasonable and was already sitting in the codebase from an earlier session,
never having been exercised this deep before).

### Bug 6: two more `__vitePreload` browser assumptions - `Event`/`dispatchEvent`, and a CSS-preload deadlock

With test files actually importing, one of them (`basics-test.gts`) crashed
during import with `Event is not defined` - not from app code, but from
Vite's own `__vitePreload` runtime helper (auto-injected around the dynamic
`import()` each matched test file desugars into): its `handlePreloadError`
constructs a real `new Event('vite:preloadError', ...)` and dispatches it
via `globalThis.dispatchEvent(...)` so app code can opt out of a default
rethrow - neither exists under NativeScript, so *that error handler itself*
throws a second, identically-shaped `ReferenceError`, masking whatever the
real underlying rejection was.

Polyfilling a minimal, inert `Event`/`dispatchEvent` in `boot-test.js`
revealed the real problem underneath: `__vitePreload`'s CSS-dependency
preloading (`document.createElement('link')` + `link.addEventListener('load'/'error',
...)`, awaited via `new Promise(...)`) was already stubbed from an earlier
session (`document.createElement` falls through to a stub object for tags
the real NativeScript element factory doesn't recognize), but that stub had
no `addEventListener` at all - a plain no-op `addEventListener` would leave
the promise permanently unsettled (nothing ever calls `res`), **deadlocking
every dynamic import that has a CSS dependency forever** - reproduced
on-device as a 30-second karma "no message" timeout with zero further
progress, no error at all.

**Fix**: both in `boot-test.js` - a minimal inert `Event` class +
`dispatchEvent` no-op (this app never listens for `vite:preloadError`), and
the `link` stub's `addEventListener('load', cb)` now resolves `cb`
asynchronously instead of doing nothing, since nothing real is actually
loading through this fake element.

### Bug 7: `ember-vite-hmr`'s `document.body` guard doesn't survive a throwing getter

With all six bugs above fixed, `pnpm test:vite` reached real QUnit execution
for the first time ever, but crashed immediately on `Cannot read properties
of undefined (reading 'bind')` inside `DocumentNode.get [as body]`, called
from `ember-vite-hmr`'s `supportErrorRecovery` instance-initializer (which
runs unconditionally on every app boot under Vite, regardless of whether an
error-recovery re-render ever actually happens).

Two bugs stacked here:
- `ember-native/src/dom/nodes/DocumentNode.ts`'s own `body` getter (defined
  via `Object.defineProperty` when a `<page>` element is created) does
  `addEventListener: globalThis.addEventListener.bind(page)` - `globalThis.addEventListener`
  doesn't exist under NativeScript (another browser-only global), so
  *accessing* `document.body` always throws, unconditionally, regardless of
  bundler.
- `patches/ember-vite-hmr@2.0.7.patch`'s existing guard,
  `if (!globalThis.document?.body) { return; }`, doesn't protect against
  this: optional chaining only guards against `document` itself being
  missing, not against the `body` *accessor* throwing the instant it's
  read - so the guard's own evaluation throws, propagating right past it.
  This is presumably why this bug was never caught before: `supportErrorRecovery`
  is Vite/`ember-vite-hmr`-only, so it's never reached under webpack at all,
  regardless of whether `DocumentNode`'s `body` getter has always been
  broken.

**Fix**: `patches/ember-vite-hmr@2.0.7.patch` (extended) - wrap the guard's
`document.body` read in a real `try`/`catch`, not just optional chaining.
`ember-native`'s own `DocumentNode.body` getter was *not* changed - per the
previous session's conclusion (search "arguably an environment gap" above),
the underlying error-recovery re-render feature can't work correctly on
NativeScript regardless, so skipping it outright is the correct behavior,
not something to route around by half-implementing a fake `document.body`.

### Bug 8 (partial - not fully fixed): `elementIterator` crashes on a malformed `childNodes`, masking real test failures

With bug 7 fixed, real QUnit tests finally ran (`Executed 1 of null`, then
climbing) - but a new, generic crash, `el.childNodes is not iterable`,
aborted whichever test hit it first. Traced (via temporary path/depth
diagnostics in `elementIterator`, since reverted) to
`ember-native/src/dom/nodes/ViewNode.ts`'s `elementIterator` - used by
`textContent`, `getElementById`, `getElementByClass`, `getElementByTagName`,
and (transitively) `querySelector` - recursing into a node whose
`childNodes` isn't a real array (a plain `{}` in the diagnostic output, seen
at a shallow, consistent tree position, always under content reached via a
real app `visit()`/`setupApplicationTest`, never under isolated
`setupRenderingTest` `render()` calls). Not fully root-caused this session -
likely a real render-teardown or Glimmer-rendering-boundary node that
`ember-native`'s own view tree doesn't fully wrap in every case, not a
Vite/webpack difference (this exact test infrastructure never got far
enough, under either bundler, in any earlier session, to have exercised this
code path before).

**Fix (partial, defensive)**: `elementIterator` now treats a non-array
`childNodes` as a leaf and returns instead of crashing the whole tree walk.
This is a legitimate hardening in its own right (a malformed node shouldn't
be able to abort every other search/assertion downstream of it), and got
five of the previously-failing tests passing outright (their assertions
never actually needed to reach past the malformed node). **Two genuine test
failures remain** (see below) - not crashes, real `assert.equal`/`assert.true`
mismatches, and this "childNodes not always an array" root cause is still
open; worth returning to since something is producing a not-quite-real node
somewhere in this tree during real app navigation specifically.

### A shared-file cross-bundler trap: `import.meta.glob` calls interfere with webpack's `require.context`, but extracting them to a separate file broke Vite worse

While fixing bug 3 above, `pnpm test` (webpack) started failing with
`TypeError: __webpack_import_meta__.glob is not a function`, thrown from
code inside the `if (typeof require !== 'undefined' && typeof require.context
=== 'function')` branch that should never execute under webpack at all.
Tried extracting all `import.meta.glob` calls out of the shared
`test-helper.ts` into a separate, dynamically-`import()`ed,
Vite-only file (`vite-test-discovery.ts`) to keep `import.meta` syntax
entirely out of the shared file - this made the symptom go away, but
introduced a **new, different, and worse** Vite-side regression: a
module-top-level dynamic `import()` whose returned promise chain has no
`.catch()` reaching all the way to the top (even one only ever *awaited*
much later, deep inside an async callback) surfaces to NativeScript's
runtime as a fatal, contentless `Module evaluation promise rejected` on the
*entire* `bundle.mjs`, aborting app boot before any of the app's own
`console.log`s even print. Confirmed by bisection (reverting just this one
file back to inline `import.meta.glob` restored the working
`Executed 7 of 7` state immediately, on an otherwise-identical set of
changes) - never fully root-caused *why* the dynamic import itself
rejected, since reverting the extraction was the pragmatic fix once
`pnpm test` (webpack) turned out to be blocked by a wholly separate,
pre-existing bug anyway (next section), making the whole extraction
unnecessary.

**Current state**: `import.meta.glob` calls are back inline in the shared
`test-helper.ts`, matching what verifiably works for `pnpm test:vite`. This
does reintroduce the `__webpack_import_meta__.glob is not a function` crash
for `pnpm test` (webpack) - **accepted for now**, since webpack's test path
turns out to already be broken by something else entirely, independent of
this file (below). If webpack's test path is ever revived instead of
removed, this file's `import.meta.glob` calls need to move to a separate
file again, this time using a **synchronous**, non-`import()`-based
mechanism to keep it out of the shared file (e.g. a build-time
find-and-replace of the whole XML-registration block, or splitting
`test-helper.ts` itself into two small, bundler-specific entry files the
way `boot-app.js`/`boot-test.js` already are, rather than a runtime
dynamic import).

### `pnpm test` (webpack) is currently broken independent of anything this session touched

Verified by reverting `test-helper.ts` to its exact pre-session state (`git
checkout`, confirmed identical to the version this branch has had since the
last webpack-path verification) and running `pnpm test` on a fully clean
`platforms/`/emulator-uninstall state: fails with `Failed to load component
from module: bundle-app-root` (`@nativescript/unit-test-runner`'s own
`Application.run({ moduleName: "bundle-app-root" })` can't resolve its own
entry module), a *different* failure from anything in this session's work,
and one that reproduces on the **unmodified** file. Not root-caused further
this session (out of scope - webpack is being removed, not maintained), but
worth recording: **the "TOTAL: 7 SUCCESS" webpack milestone from the
sub-task-3 session is currently stale/unreproducible as-is**, likely
because of some interaction with the `boot-app.js`/`boot-test.js` entry-file
split done in the following session (moving shared content out of `app/`
entirely - see this file's "Follow-up session: three more real bugs fixed"
section above). This means webpack is no longer a reliable fallback either
way - one more reason to finish the Vite-only path rather than invest in
fixing webpack back to a working state.

### Current status and next steps

`pnpm test:vite` reaches real, complete QUnit execution for the first time
in this migration's history: `Executed 7 of 7 (2 FAILED)`, reproduced twice
in a row on a fully clean rebuild (`rm -rf platforms .ns-vite-build tmp`,
`adb uninstall`, full Gradle build from scratch). The 2 remaining failures:

1. `Acceptance | root > navigating with link to` - `Expected: true, Actual:
   false` at the assertion checking the actionbar title after `click('button')`
   navigates - the "visiting /login" test in the same file (same `visit('/')`
   + title-check pattern, no click) passes, so this looks
   click-navigation-specific, not a general rendering issue.
2. `Basics | rendering & modifier > modifier works` - `Expected: true,
   Actual: false` on `assert.equal(clicked, true)` after `await
   click('button')` on a `{{on 'tap' onClick}}`-modified button - a tap/click
   event simulation not reaching the modifier's handler.

Both remaining failures involve `click()` specifically (not `render()`,
`visit()`, or `rerender()` alone) - worth investigating together, possibly a
single shared root cause in how `@ember/test-helpers`' `click()` simulates a
tap/press on a NativeScript view. Bug 8 above (`elementIterator`'s
non-array `childNodes`) is also still open and may or may not be related.

**Do not remove webpack or mark the "fully remove webpack" todo item done
yet** - still gated on a real `TOTAL: N SUCCESS` `pnpm test:vite` run with
zero failures. Next session: start with the `click()`/tap-modifier
investigation above, and only once that's clean, revisit whether
`pnpm test` (webpack) is worth resurrecting or can be deleted outright given
its own independent breakage.

## Follow-up session: root-caused and fixed the `click()` bug, `pnpm test:vite` reaches `TOTAL: 7 SUCCESS` - webpack removed

Root cause for both remaining failures turned out to be a single bug, found
by adding temporary diagnostic logging to `NativeElementNode.dispatchEvent`
(prints the event's resolved `eventName`) and to
`@ember/test-helpers`'s `dist/dom/fire-event.js` (prints which of its three
mouse-event-construction code paths - real `MouseEvent` constructor,
`document.createEvent('MouseEvents')`, or the generic `buildBasicEvent`
fallback - actually runs) and rerunning on-device:

```
FIRE-EVENT-DIAG typeof MouseEvent at module load = undefined
FIRE-EVENT-DIAG new MouseEvent(test) threw MouseEvent is not defined
...
FIRE-EVENT-DIAG createEvent(MouseEvents) fallback threw event.initMouseEvent is not a function falling back to buildBasicEvent for type click
DISPATCH-DIAG click Button false
```

`ember-native`'s `setup()` (in `src/setup.ts`) installs a `globalThis.MouseEvent`
shim whose constructor translates a DOM `'click'` type into NativeScript's
`'tap'` (matching `LinkTo`'s and the demo app's own `{{on 'tap' ...}}`
convention - `<button>` specifically routes `'tap'` listeners through
`@nativescript/core`'s plain `Observable` event system rather than a native
gesture recognizer, since `ButtonBase` declares a static `tapEvent = 'tap'`,
confirmed by reading `ui/core/view/view-common.js`'s `_isEvent`/`addEventListener`
and `ui/button/button-common.js` - so `nativeView.notify({eventName: 'tap', ...})`
*would* correctly reach a `{{on 'tap' onClick}}`-registered handler, once the
event actually carries type `'tap'`). But `@ember/test-helpers`'s
`fire-event.js` decides once, at its own module's top-level (`const
MOUSE_EVENT_CONSTRUCTOR = (() => { try { new MouseEvent('test'); ... } })()`),
whether a real `MouseEvent` constructor exists, and caches that boolean for
the lifetime of the module. Under this Vite bundle, `fire-event.js` gets
evaluated (as part of the overall `bundle.mjs` module graph) before
`ember-native`'s `setup()` has run - `globalThis.MouseEvent` doesn't exist
yet, the capture permanently locks in `false`, and every later `click()`
falls through to `document.createEvent('MouseEvents')`
(`DocumentNode.createEvent` only implements a bare `initEvent`, not
`initMouseEvent`, so this throws) and then to `buildBasicEvent`, which
preserves the event's `type` completely unchanged (`'click'`/`'mousedown'`/
`'mouseup'`, never translated to `'tap'`) - so the `'tap'`-registered handler
(both `LinkTo`'s navigation and the raw `{{on 'tap' onClick}}` test) never
fires. This is the exact same *shape* of bug as the earlier
`engine.io-client`'s `global.WebSocket` capture (a dependency's own
module-load-time global capture racing against `ember-native`'s runtime
setup, order not guaranteed by Rollup's whole-bundle evaluation order) - and
the fix follows the same precedent: don't try to win the ordering race by
rearranging imports (already shown unreliable for the WebSocket case), make
the capture lazy instead.

**Fix**: extended `patches/@ember__test-helpers.patch` (already patching two
unrelated `document.location` guards in this same package) to replace
`fire-event.js`'s eager, module-load-time `MOUSE_EVENT_CONSTRUCTOR` boolean
with a `hasMouseEventConstructor()` function that performs the same
`new MouseEvent('test')` probe lazily, memoized on first *call* instead of
module load - so it always runs after `ember-native`'s `setup()`, regardless
of Rollup's bundle-wide module evaluation order. No `ember-native` source
changes were needed (`NativeElementNode.dispatchEvent`'s
`event.eventName = event.type; this.nativeView.notify(event)` was already
correct - the diagnostic logging added there to confirm this was reverted
after use). Verified with `pnpm test:vite`:
`Executed 7 of 7 SUCCESS` - reproduced twice, including once from a fully
clean rebuild (`rm -rf platforms .ns-vite-build tmp`, `adb uninstall`).

**Webpack fully removed** as of this session, now that the vite-only test
path is verified clean:

- `demo-app`: deleted `nativescript.test.config.ts` and `webpack.config.js`;
  `package.json`'s `test`/`debug-test` scripts now point at
  `nativescript.test.vite.config.ts --no-watch` (what `test:vite`/
  `debug-test:vite` used to be - those aliases were removed as redundant);
  removed the `@nativescript/webpack` and `babel-loader` devDependencies
  (both were only ever needed for the webpack test config).
- `.github/workflows/app-test.yml`'s "run tests" step now runs
  `nativescript test android --emulator --config
  nativescript.test.vite.config.ts --no-watch` instead of the webpack
  config.
- `ember-native` (the addon): removed `utils/webpack.config.js` and
  `utils/embroider-webpack-adapter.js` (the addon's own published
  webpack-adapter helper for consuming apps) and the now-unused
  `@embroider/webpack`/`webpack-virtual-modules` dependencies. This is a
  breaking change for any downstream app still consuming
  `ember-native/utils/webpack.config.js` directly - acceptable per this
  task's explicit "fully remove webpack" instruction, and consistent with
  `demo-app` (the only consumer verified in this repo) having had zero
  remaining webpack usage once its own test path moved to vite.
- Confirmed via `grep -ri webpack` across the repo (excluding
  `node_modules`/build output) that all remaining hits are either this
  historical writeup, `CHANGELOG.md`/`NATIVESCRIPT_UPGRADE_NOTES.md`
  (historical, left as-is), or `docs-app`'s own `@embroider/webpack`
  Ember-CLI website build target - a wholly separate "webpack" (Embroider's
  build-tool choice for the documentation site, unrelated to NativeScript's
  app bundler) that this task was never about and was left untouched.

## Follow-up session: fixed CI hanging forever after `TOTAL: 7 SUCCESS`

PR #396 (this migration) passed CI's actual test assertions -
`nativescript test android --config nativescript.test.vite.config.ts
--no-watch` reached `TOTAL: 7 SUCCESS` in the Android emulator job - but the
CI job itself never finished: it sat with no further output for the rest of
its 30-minute timeout until manually canceled. Reproduced locally against a
real emulator with `CI=true npx nativescript test android --emulator
--config nativescript.test.vite.config.ts --no-watch` (matching CI's own
`CI=true`, which GitHub Actions sets automatically) - confirmed the hang is
real and unrelated to `CI` being set (an earlier session's note above,
written for the now-removed webpack test path, that `CI=true` alone fixes a
"hangs after `TOTAL: 7 SUCCESS`" symptom is *not* the same bug as this one -
that one was `karma.conf.js`'s `singleRun: process.env.CI` never turning on;
this one still hangs even with `singleRun` correctly on).

**Root cause**, found by adding a temporary `console.log` of karma's
internal `singleRunDoneBrowsers` bookkeeping object (in
`karma@4.4.1/lib/server.js`, reverted after use) right before the check that
decides whether to emit `run_complete`: the object never has all its values
`true`, because it has two different keys for what should be the same
browser - `{"53830505": false, "NativeScriptUnit-527": true}` in one capture.
`53830505` is the id karma's own `Launcher` assigned when it launched the
`android` custom browser (`karma/lib/launcher.js`'s
`Launcher.generateId()`); `NativeScriptUnit-527` is a random id the device
app made up itself, in `@nativescript/unit-test-runner`'s
`main-view-model.js`, when it called `socket.emit('register', { id:
'NativeScriptUnit-' + (0 | (Math.random() * 10000)), ... })`. A normal
browser launcher (e.g. Chrome) guarantees these match by putting its id in
the URL it opens (`url + '?id=' + this.id`, in karma's own
`launchers/base.js`) and having the browser report that same id back on
`register` - `karma-nativescript-launcher`'s own `self.start` completely
overrides the inherited `start()` instead of calling it, so the id was never
sent to the device at all, and this cross-package contract was silently
broken from the start. Karma's singleRun completion path
(`browser_complete_with_no_more_retries` in `server.js`) always writes to
`singleRunDoneBrowsers` keyed by the *browser's* reported id, but the object
was only ever seeded (in `afterPreprocess`) with the *launcher's* id as a
key - so the launcher's original `false` entry is never touched again, and
`Object.keys(singleRunDoneBrowsers).every(...)` never passes, so
`run_complete` never fires, so the karma server process never exits, so
`nativescript` CLI's `TestExecutionService.startKarmaServer` (which awaits
that child process's `exit` event before the `test` command's own
`process.exit(0)`) never returns. Confirmed with the same `console.log`
that, without this fix, the offending launcher-id key stays `false`
forever; a manual `SIGTERM` against the hung process additionally crashes
with `TypeError: The "code" argument must be of type number. Received type
string ('SIGTERM')` from karma's own `Server.close` handler passing the
signal name straight through as an exit code - a real, separate karma bug,
but only a masking symptom of forcibly killing the hang, not something
addressed here.

**Fix**: two small patches (`patches/karma-nativescript-launcher@1.0.0.patch`,
new; `patches/@nativescript__unit-test-runner@4.0.1.patch`, extended) that
restore the id contract karma expects, instead of touching karma itself
(a plain devDependency, not code this repo owns):

- `karma-nativescript-launcher`'s `self.start` now sends its own `id` to the
  device alongside the existing `launcherConfig` (piggybacking on the
  `options` object the NativeScript CLI's `TestExecutionService` already
  forwards verbatim into the on-device `config.js` - no CLI changes needed).
  Its `browser_register` listener, which used to gate on `browser.id`
  starting with `"NativeScript"` to recognize a real device registering
  (as opposed to some other browser type), now checks `browser.fullName`
  instead (the device's `name: 'NativeScript / ...'` display string, still
  stable) - `browser.id` is no longer guaranteed to look like that once it's
  the launcher's own numeric id.
- `main-view-model.js`'s `register` call now uses `config.options.id` when
  the launcher supplied one, falling back to the old random
  `'NativeScriptUnit-...'` id otherwise (e.g. for `tns dev-test`, which uses
  a different, non-single-run launcher path untouched by this bug).

**Follow-up**: `patches/karma-nativescript-launcher@1.0.0.patch` has since
been removed - the `karma-nativescript-launcher` npm dependency was replaced
outright with a local `karma-launcher/` workspace package (same treatment
`@nativescript/unit-test-runner` got, see the "Our own unit test runner"
section), linked in from `demo-app/package.json` via
`"karma-nativescript-launcher": "link:../karma-launcher"`. Karma's own
plugin auto-discovery convention requires the package to still be
`require()`-able under the literal name `karma-nativescript-launcher`
(that's also why the CLI's `test-dependencies.json` lists it by that exact
name), so the package.json `name` field stayed the same even though it's no
longer the upstream package - `karma-launcher/index.js` has the id-passthrough
fix above written directly into its source instead of patched onto a
third-party copy.

Verified on a real Android emulator, from a fresh `adb uninstall` each time,
across two consecutive runs: `CI=true`/CI-equivalent `nativescript test
android --emulator --config nativescript.test.vite.config.ts --no-watch`
now exits with code `0` within ~30 seconds of starting, immediately after
`TOTAL: 7 SUCCESS`, both times - no hang, no `SIGTERM` crash.

## Follow-up session: removed `patches/@ember__test-helpers.patch` via a build-time globals banner instead

`patches/@ember__test-helpers.patch` fixed two independent problems: (1)
`dist/-internal/deprecations.js`/`warnings.js` assuming `document.location`
exists at their own module top level, and (2) `dist/dom/fire-event.js`
caching `typeof MouseEvent !== 'undefined'` into a `MOUSE_EVENT_CONSTRUCTOR`
boolean at module load time, before `ember-native`'s `setup()` (which
installs the real, tap-translating `globalThis.MouseEvent`) has run (see the
earlier "root-caused and fixed the `click()` bug" section above for the full
original diagnosis). The task: stop needing to patch the dependency at all,
using a global/environment fix instead - matching how the `@rollup/plugin-replace`-based
`structuredClone` fix in `ember-native/utils/vite.config.js` already handles
the same *class* of bug for a different dependency.

**Why reordering `bundle.mjs`-side imports can't work, confirmed structurally
this session**: `@nativescript/vite`'s `manualChunks`
(`configuration/base.js`) buckets every generic `node_modules` dependency -
including `@ember/test-helpers` - into a single `vendor.mjs` chunk, kept
separate from the app's own `bundle.mjs` (where `ember-native`'s `setup()`
actually runs, called from `demo-app/app/native/setup-ember-native.ts`).
`bundle.mjs` always has a real static import back into `vendor.mjs` - at
minimum for `@glimmer/runtime`, which `ember-native/src/setup.ts` imports
directly - and the ECMAScript module spec guarantees a module's imports
finish evaluating before *any* of the importing module's own top-level code
runs, regardless of where in the importing module's source that import is
textually positioned. So `vendor.mjs` as a whole always fully evaluates
before a single line of `bundle.mjs`'s own body runs. That rules out two
superficially-plausible fixes: reordering `demo-app/app/test.js`'s imports
(already the existing arrangement, and already shown not to help - see the
original diagnosis), and `@nativescript/vite`'s own `polyfills.ts` extension
point (`@nativescript/vite/helpers/main-entry.js`'s "Optional polyfills
support" - statically imported into the generated `virtual:entry-with-polyfills`
entry *before* the app's own `main` entry point). Both live in `bundle.mjs`,
not `vendor.mjs`, so both lose the exact same race, no matter how early they
run relative to the rest of `bundle.mjs`.

**Fix**: a new `earlyGlobalsBanner()` Rollup plugin in
`ember-native/utils/vite.config.js`, using the `renderChunk(code)` hook to
prepend a small banner of placeholder globals
(`globalThis.document = { location: { search: '' } }`,
`globalThis.MouseEvent = function MouseEvent(type, eventOpts) { ... }`) as
raw text to *every* emitted chunk's own source. Unlike an `import`, banner
text has no dependencies of its own to wait on - it's always the first
synchronous statements of whichever chunk it's part of. Confirmed by
inspecting a real, fresh `nativescript prepare android --config
nativescript.test.vite.config.ts` build's `.ns-vite-build/vendor.mjs`: the
banner is the first ~6 lines of the file (right after two harmless
esbuild-injected `__defProp`/`__name` helper `var`s), `vendor.mjs` has zero
`import` statements of its own (`grep -n '^import\|^export'` only matches a
single trailing `export {` - i.e. it's a true leaf chunk, nothing needs to
evaluate before it), and `@ember/test-helpers`'s `document.location`/
`new MouseEvent` references sit ~144,000 lines later in that same file. That
ordering is enough for both problems the patch fixed:
`deprecations.js`/`warnings.js` only ever read `document.location` once, at
module top level (an empty placeholder satisfies that); `fire-event.js`
only *caches a boolean* from its early `new MouseEvent('test')` probe - the
actual `new MouseEvent(type, opts)` call it makes later, when a test's
`click()` really runs, looks up `MouseEvent` on `globalThis` fresh at call
time (a plain, unbound identifier reference, re-resolved on every call),
long after `setup()` has overwritten the placeholder with the real,
tap-translating implementation.

`patches/@ember__test-helpers.patch` and its `pnpm.patchedDependencies`
entry were removed entirely. Confirmed via `pnpm install` that
`@ember/test-helpers`'s `node_modules/.pnpm` directory no longer has a
`patch_hash`-suffixed variant, and its installed `dist/dom/fire-event.js` is
back to the unpatched upstream code (eager `const MOUSE_EVENT_CONSTRUCTOR =
(() => { try { new MouseEvent('test'); ... } })()`).

**Not verified with a real on-device `TOTAL: N SUCCESS` run** - unlike every
other change in this document. `pnpm test` currently fails to even boot on
this machine's emulator, crashing with a generic, contentless `Error: Module
evaluation promise rejected: .../bundle.mjs` (`com.tns.NativeScriptException`,
no further detail, same failure shape mentioned earlier in this document).
Bisected carefully before concluding this is unrelated to this session's
change:

1. Reproduces identically with this session's `earlyGlobalsBanner()` fix
   fully in place.
2. Reproduces identically with the original, previously-working
   `patches/@ember__test-helpers.patch` restored and the banner plugin
   disabled (i.e. the exact patch-based fix that once reached `TOTAL: 7
   SUCCESS`).
3. Reproduces identically on a **fully pristine `git HEAD` checkout** (`git
   checkout` every changed file back, confirmed via `git diff` showing
   nothing), after a completely clean rebuild (`adb uninstall`, `rm -rf
   platforms .ns-vite-build tmp`) and even after rebooting the emulator
   itself (it had been up 16+ hours).
4. Rerun with `NS_VERBOSE=1` (`@nativescript/vite`'s own verbose-boot-diagnostics
   env var, see `helpers/logging.js`'s `resolveVerboseFlag`) - not even the
   *first* `console.info('[ns-entry] begin', ...)` the generated entry
   module emits (before `@nativescript/core/globals/index`, before anything
   app- or dependency-related) ever reaches `adb logcat`. The crash happens
   in the native module loader (`com.tns.Runtime.runModule`) before a single
   line of JS body executes, not inside any code this session touched.

**Prime suspect**: the immediately-preceding commit, `cdd299f` ("Replace
`@nativescript/unit-test-runner` npm package with our own local
`unit-test-runner/` workspace package") - the one `ember-native-todo.md`
item right before this one, which, unlike every other entry in that file,
has no "Verified: ... `TOTAL: N SUCCESS`" writeup attached. **Next session
should root-cause this before trusting any further on-device test-path
verification** - a `git bisect` between `d2a7a70` ("Fix CI hanging forever
after TOTAL: 7 SUCCESS") and HEAD, or temporary native-side logging around
`com.tns.Runtime.runModule`, are the most direct next steps. Until that's
fixed, this session's `@ember/test-helpers` change is verified
build-time/structurally (as detailed above) but not with a real device run.

## Follow-up session: removed the remaining 4 runtime-dependency patches (`ember-native-todo.md` sub-task A)

`patches/@ember__test-waiters.patch`, `patches/@nativescript__core@9.0.20.patch`,
`patches/ember-vite-hmr@2.0.7.patch`, and `patches/engine.io-client@3.2.1.patch`
all patch dependencies that end up bundled into the app's own Vite/Rollup
output (as opposed to `patches/karma-nativescript-launcher@1.0.0.patch` and
`patches/nativescript@9.0.6.patch`, which patch host-side tooling that never
passes through this pipeline - separate sub-tasks). Removed all four,
replaced by `ember-native/utils/vite-dependency-patches.js`, a new Vite
plugin wired into `ember-native/utils/vite.config.js`'s `plugins` array that
applies the same source edits at build time via a `transform` hook matched
by module id, instead of a pnpm patch mutating `node_modules` on disk.
Every entry's `apply()` throws if its expected original text isn't found -
the same "refuse to silently proceed" behavior `pnpm install` gets for free
when a patch no longer applies has to be reproduced explicitly here. All
four patches' text edits were diffed against the original patch files
(`git show HEAD:patches/...`) to confirm the transform reproduces them
byte-for-byte before removing the originals.

**One of the four needed a genuinely different fix, not just a different
mechanism for the same edit.** `ember-vite-hmr@2.0.7.patch`'s
`dist/lib/hmr.js` hunk (the `if (!server) { continue; }` guard in the
`hmr()` plugin's own `transform` hook) looked like a natural fit for the
same `transform`-hook treatment as the patch's other hunk
(`dist/instance-initializers/vite-hot-reload.js`, real bundled Ember
runtime code - that one ported over with no issues). It doesn't work: a
first attempt at porting it as a `match`/`apply` entry passed lint and
`pnpm build` but failed a real `nativescript build android` with
`[vite:load-fallback] Could not load /ember-vite-hmr/virtual/component:...`
(`ENOENT`). Root cause: `dist/lib/hmr.js` **is** the Vite plugin factory -
`demo-app/vite.config.ts` does `import { hmr } from 'ember-vite-hmr'` and
calls it directly - so it's loaded and evaluated by Node's own module
system while Vite's config file is being imported, well before Rollup's
build pipeline exists, let alone starts transforming modules. Unlike
`vite-hot-reload.js`, `transform` never sees this file's source at all, so
a `match`/`apply` entry for it is silently dead code (confirmed by adding a
temporary `console.error` inside `transform` - it never fired for this id,
while the same technique fired instantly for `dist/instance-initializers/
vite-hot-reload.js` and the other three dependencies' files). A second,
harder-to-catch trap on top of that: `demo-app/vite.config.ts` imports
`ember-native/utils/vite.config.js` via that package's `"./utils/*":
"./dist/utils/*"` export map, i.e. the **built** `dist/`, not the source
tree - editing `ember-native/utils/vite-dependency-patches.js` and rebuilding
demo-app has zero effect until `pnpm --filter ember-native build` regenerates
`dist/utils/vite-dependency-patches.js`. Lost real time to this the first
time around (identical `ENOENT` before and after an edit that should have
fixed it) before checking the export map and realizing the fix was staged
in source but never reached the running build.

The actual bug in `hmr()`'s `transform` hook: it always emits a dynamic
`import('/ember-vite-hmr/virtual/component:...')` per HMR-tracked component
import, guarded only by a runtime `if (import.meta.hot) {...}` (dead in a
`vite build`, since Vite replaces `import.meta.hot` with `undefined` for
builds) - but Rollup still has to *resolve and load* every
statically-discovered dynamic import while constructing its module graph,
regardless of whether tree-shaking will later prove the branch unreachable;
tree-shaking happens in a later phase (code generation), after every import
in the graph has already been resolved and loaded. `hmr()`'s own
`resolveId` accepts the virtual id unconditionally, but its `load` hook
returns `null` for it whenever there's no live dev server available
(`if (!server) { return null; }` - `server` is only ever set via
`configureServer`, which `@nativescript/vite` never calls, since its
`build`/`test` commands always do a one-shot/watched `vite build`, never
`vite dev`). `null` means "not handled" to Rollup, so it falls through to
the default filesystem loader, which throws `ENOENT` trying to read a fake
path off disk.

Fixed as a `load` hook on *our own* plugin instead (`ember-native/utils/
vite-dependency-patches.js`'s `dependencySourcePatches()`, alongside its
existing `transform` hook and a `configureServer` hook that tracks the same
`server` presence): Rollup's `resolveId`/`load` hooks run in `enforce`
bucket order (pre, then normal, then post) and stop at the first plugin
that returns non-nullish. Since this plugin has no `enforce` (normal
bucket) and `hmr-plugin` is `enforce: 'post'`, ours always runs first for
the same id - returning a harmless stub module
(`'export default undefined;'`) whenever `!server` means `hmr-plugin`'s own
`load` (which would return `null` anyway in that case) never even runs.
The stub's content doesn't matter at runtime: the only code that reads it
(`c.default`, `import.meta.hot.accept(...)`) sits behind the same dead
`if (import.meta.hot)` guard.

**Verified**: `pnpm --filter ember-native lint` and `pnpm build` (root, all
workspace packages) pass. A full clean `nativescript build android`
(`adb uninstall`, `rm -rf platforms .ns-vite-build tmp`) succeeds end to
end and produces a real APK - confirmed the `ENOENT` is gone (it reproduced
identically before the `load`-hook fix, on the same clean-rebuild
procedure). Installed and launched that APK on a real emulator: it crashes
with the exact same `Error: Module evaluation promise rejected: .../
bundle.mjs` this document already describes above as a pre-existing,
unrelated regression - **confirmed still pre-existing and unrelated** by
reproducing the identical crash on a fully pristine, untouched `git HEAD`
checkout (`git stash -u`, `pnpm install`, clean rebuild, same install/launch
steps) before restoring this session's changes. Also tried `pnpm test`
(the vite-only test path, `nativescript.test.vite.config.ts`): its build
fails earlier and differently -
`[commonjs--resolver] ember-native is trying to import from qunit but that
is not one of its explicit dependencies`, from `qunit-esm-shim.js`'s import
of `qunit/qunit/qunit.js` (added in the `ember-qunit@9.0.4.patch` removal
session, see above) - a second, separate pre-existing/unrelated issue, not
touched by this session's changes either. Both are blockers for a real
on-device `TOTAL: N SUCCESS` confirmation of this change, same as every
patch-removal session since the `cdd299f` regression was introduced -
next session should still start with root-causing that regression (see the
bisection plan above) before any further on-device verification is
possible.

## Follow-up session: removed `patches/nativescript@9.0.6.patch` via a runtime CLI monkeypatch (`ember-native-todo.md` sub-task C)

The last of the three sub-tasks from the "fix all pnpm patches" item. Unlike
sub-task A (dependencies bundled through Vite - fixed with a `transform`/
`load` Vite plugin) or sub-task B (`karma-nativescript-launcher` - forked
into a small local workspace package, same treatment as
`@nativescript/unit-test-runner`), `nativescript@9.0.6.patch` patches the
CLI package itself: `BundlerCompilerService.compileWithoutWatch`, in
`lib/services/bundler/bundler-compiler-service.js`, adding the
`copyViteBundleToNative(distOutput, destDir)` call this document's "A real,
upstream `nativescript` CLI bug" section above describes. This runs in the
**host CLI process**, never through Vite/Rollup, so a `transform`/`load`
Vite plugin can't reach it - and `nativescript` is too large a package to
fork wholesale the way `unit-test-runner`/`karma-nativescript-launcher`
were (it's the entire CLI, hundreds of files, with its own release
cadence this project wants to keep tracking via `^9.0.6`, not fork and
freeze).

**Fix**: a runtime monkeypatch instead - new `demo-app/scripts/
nativescript-cli.js`, a plain Node script that:
1. `require('nativescript/lib/bootstrap')` first. This registers every CLI
   service (by name, lazily) with the CLI's own Yok DI container. It's
   required *before* touching `bundler-compiler-service.js` because that
   file decorates some of its methods with a `@performanceLog()`-style
   decorator that resolves the `performanceService` dependency **eagerly,
   at class-definition time** - not lazily, at method-call time. Requiring
   `bundler-compiler-service.js` standalone, without bootstrap ever having
   run, throws `Error: unable to resolve performanceService` the moment
   the class body evaluates (confirmed by reproducing this in isolation
   with a bare `node -e "require('nativescript/lib/services/bundler/
   bundler-compiler-service')"`). `bin/tns` (required in step 3) does this
   same `require('./bootstrap')` internally too - Node's module cache makes
   this an idempotent no-op from the CLI's own perspective, so requiring it
   ourselves first doesn't change the CLI's own behavior, only the order in
   which it happens relative to our own patch.
2. Requires `BundlerCompilerService` and replaces
   `.prototype.compileWithoutWatch` with a wrapper that calls the original
   implementation, then - if `this.getBundler() === 'vite'` - runs the
   exact same `copyViteBundleToNative(distOutput, destDir)` call the patch
   added, computed the same way (`path.join(projectData.projectDir,
   '.ns-vite-build')` / `path.join(platformData.appDestinationDirectoryPath,
   this.$options.hostProjectModuleName)`). Wrapping the whole method
   (rather than trying to splice a line into its `childProcess.on('close',
   ...)` closure, which isn't reachable from outside the method) is
   semantically equivalent here: the original method's promise only
   resolves after the child process exits 0, so running the copy
   immediately after `await`-ing that resolution happens at effectively
   the same point the patch's inline version did, just one microtask later
   - nothing in the caller observes or depends on the difference.
3. `require('nativescript/bin/tns')` - runs the real CLI, forwarding
   `process.argv` unchanged (this file replaces the CLI's own entry script
   in the process, so `process.argv.slice(2)` - what `bin/tns`'s own argv
   parsing reads - is identical to what it would've seen if invoked
   directly).

This script is invoked in place of the `nativescript`/`tns` bin everywhere
in this repo: `demo-app/package.json`'s `run`/`test`/`build`/`debug-test`/
`debug`/`prepare-android` scripts, and both nativescript-CLI-invoking steps
in `.github/workflows/app-test.yml` (`build`'s `pnpm tns build android` and
`run tests`' `npx -y nativescript test android ...`) now call
`node scripts/nativescript-cli.js <same args>` instead. CI in particular
matters here: it never went through `demo-app/package.json`'s own `build`/
`test` scripts to begin with (`pnpm tns`/`npx nativescript` call the CLI
bin directly), so fixing only the npm scripts and leaving CI as-is would
have looked correct locally while silently reintroducing the original bug
in CI.

`patches/nativescript@9.0.6.patch` and its `pnpm.patchedDependencies` entry
were removed. `patches/` is now empty - all six patches this repo
accumulated across the Vite migration (`@nativescript/core`,
`@nativescript/unit-test-runner`, `karma-nativescript-launcher`,
`ember-vite-hmr`, `engine.io-client`, `@ember/test-waiters`,
`@ember/test-helpers`, `ember-qunit`, `log-symbols`, and now `nativescript`
itself) are gone, replaced by either a real local implementation, a
build-time Vite plugin, or - for this last one - a runtime monkeypatch.

### An unrelated discovery while verifying: several already-latent phantom dependencies tipped over into hard failures

Verifying this change properly (per this document's own "Prerequisite:
verify on a real build" section) meant a fully clean `rm -rf node_modules
&& pnpm install` plus a clean `nativescript build android`
(`rm -rf .ns-vite-build tmp platforms` first) - not just a green `pnpm
build`. Doing that turned up something surprising and initially very
confusing: with `patches/nativescript@9.0.6.patch` removed, a clean install
+ build failed with `Cannot find module '@babel/plugin-syntax-typescript'`,
thrown from **`ember-vite-hmr`'s own `hmr()` Vite plugin** trying to
`parseSync` a Vite-internal virtual module (`vite/preload-helper.js`, the
`__vitePreload` runtime helper - not a real file on disk). Reverting only
the patch removal (`git stash`, same clean-install-and-build procedure)
made the failure disappear; re-applying the diff reproduced it again,
consistently, across several repeated clean-install trials in both
directions - so this really was caused by removing the patch, not
random per-run pnpm flakiness.

The actual mechanism has nothing to do with `copyViteBundleToNative` or
anything this session's code changes touch. `ember-vite-hmr`'s `hmr.js`
references three packages as bare Babel plugin names it never declares as
real dependencies of its own (`@babel/plugin-syntax-typescript`,
`@babel/plugin-proposal-decorators`) - a pre-existing phantom-dependency
bug in `ember-vite-hmr` itself, unrelated to this repo. It only ever
"worked" because pnpm's dependency graph happened to place a matching
version reachably, by luck, via its flat `.pnpm/node_modules` fallback
resolution. Removing `patchedDependencies` shifts the overall dependency
graph's shape enough (confirmed via `pnpm-lock.yaml`'s diff: an unrelated
peer-dependency hash changed for `eslint-plugin-ember`/`ember-eslint-parser`,
even though `nativescript`, `vite`, `@nativescript/vite`, and
`ember-vite-hmr` all kept byte-identical resolved versions/hashes) to tip
that lucky resolution over into a hard failure. A very similar,
independently-triggered phantom-dependency gap surfaced right after fixing
that one: `@rollup/plugin-babel`'s handling of `demo-app`'s own
`@babel/plugin-transform-runtime` config needs `@babel/runtime` as a real
dependency (textbook Babel usage - `plugin-transform-runtime` always needs
its counterpart `@babel/runtime`) but `demo-app/package.json` never
declared it either. Fixed pragmatically by declaring what was already being
used implicitly: `@babel/plugin-proposal-decorators` and
`@babel/plugin-syntax-typescript` as root `devDependencies` (empirically
where Babel's own plugin-name resolution - `require.resolve(id, {paths:
[dirname]})` with a `dirname` derived from the virtual module's fake path,
not a real one - actually reaches; declaring them in `demo-app/package.json`
instead did not fix it, despite `demo-app` being a real ancestor directory
of the same physical `node_modules/.pnpm` tree), and `@babel/runtime` as a
real `demo-app` dependency (it ships in the app bundle, so it belongs in
`dependencies`, not `devDependencies`).

While verifying `nativescript test android`'s path too (same
`compileWithoutWatch` code, exercised via `--no-watch`), a fourth phantom
dependency of the same shape turned up: `demo-app/vite.test.config.ts`'s
own `require.resolve('generator-function/package.json')` (a documented
workaround for `is-generator-function`'s dual-package hazard) - fixed by
declaring `generator-function` as a `demo-app` devDependency too.

None of these four are new bugs introduced by this session's actual code
change (the CLI monkeypatch) - they're pre-existing gaps in this project's
dependency declarations that were already silently relying on pnpm
resolution luck, and this session's `patchedDependencies` removal happened
to be the lockfile perturbation that exposed them. They had to be fixed
here anyway, though, since leaving them broken would mean this session's
actual change (the CLI patch replacement) could never be verified with a
real build, and `pnpm install` in CI is always a fresh install, so CI would
have hit the exact same failures.

**Verified**: with the patch removed and the four phantom dependencies
declared, a fully clean `rm -rf node_modules && pnpm install` followed by
`rm -rf .ns-vite-build tmp platforms && node scripts/nativescript-cli.js
build android` succeeds end to end, including the Gradle/Static Binding
Generator step this bug specifically affects - confirmed by inspecting
`platforms/android/app/src/main/assets/app/` directly and finding real
`bundle.mjs`/`vendor.mjs` content there (not just an empty directory with a
`package.json`, the original bug's symptom). Installed the resulting APK
on a real Android emulator: it launches and then crashes with the exact
same `Error: Module evaluation promise rejected: .../bundle.mjs` this
document already describes elsewhere as a pre-existing, unrelated
regression (see the "Follow-up session: removed the remaining 4
runtime-dependency patches" section above, and item 73/76 in
`ember-native-todo.md`) - not a new failure mode, and not something this
sub-task is responsible for fixing. Also tried `node scripts/
nativescript-cli.js test android --emulator --config
nativescript.test.vite.config.ts --no-watch`: it gets exactly as far as
the already-documented, already-tracked `qunit-esm-shim.js` phantom-import
failure (`ember-native is trying to import from qunit but that is not one
of its explicit dependencies`, see the same section above) - the identical
pre-existing blocker the immediately-prior session left off at, confirming
this session's change introduces no new test-path regression beyond what
was already known. `pnpm --filter ember-native lint` and `demo-app`'s own
`pnpm lint:js` both pass on this session's new file (`demo-app/scripts/
nativescript-cli.js`); the 7 pre-existing `demo-app` lint errors reproduce
identically on an unmodified `git HEAD` checkout and are unrelated to this
change.

## Follow-up session: shipped the CLI monkeypatch as a real published binary, not a demo-app-local script

PR #396 review feedback: `ember-native` is a library other people install into
their own NativeScript/Ember apps, not just a monorepo with one demo app. The
previous session's fix for the "real, upstream `nativescript` CLI bug" (see
above) - `demo-app/scripts/nativescript-cli.js` - only protected this repo's
own `demo-app`. Any consuming app using `@nativescript/vite` hits the exact
same upstream bug (`compileWithoutWatch` never copying Vite's output into the
native platform project), and had no way to get this fix short of copy-pasting
the script into their own app.

**Checked for an upstream fix/alternative first**, rather than assuming a
workaround was still needed: `npm view nativescript versions` shows the latest
stable is still `9.0.6` (unfixed), but unpacking the `9.0.7-next.*`/`9.1.0-*`
prerelease tarballs and reading `lib/services/bundler/bundler-compiler-service.js`
directly shows `compileWithoutWatch` already calls `copyViteBundleToNative`
itself there - upstream has fixed this, just not in a released stable version
yet, and no tracking GitHub issue for it was found (searched
`NativeScript/nativescript-cli`'s issues). So: no alternative fix available
today, but this is expected to become moot once a `9.0.7`/`9.1.0` stable ships.

**Fix**: moved the monkeypatch from `demo-app/scripts/nativescript-cli.js` into
the addon itself, `ember-native/utils/nativescript-cli.js` (copied to
`dist/utils/` by the existing `rollup-plugin-copy` step, same as
`vite.config.js`/`vite-dependency-patches.js`), and published it as a real CLI
binary via `ember-native`'s new `package.json` `"bin"` entry:
`ember-native-nativescript`. Any consuming app can now point their
`build`/`test`/`debug`/`run`/`prepare` scripts at `ember-native-nativescript`
instead of `nativescript`/`tns` directly, the same way this repo's `demo-app`
now does.

Two things changed versus the original script to make it work as a published
package binary rather than an in-repo script, both necessary because a v2
addon like `ember-native` never depends on `nativescript` itself (only
consuming apps do):

1. **Module resolution now targets the invoking project's `cwd`, not
   `__dirname`.** The original script lived inside `demo-app/scripts/`, a real
   subdirectory of `demo-app`, so a plain `require('nativescript/...')`
   naturally found `demo-app`'s own `nativescript` dependency by walking up
   from there. Shipped as a package binary, the file's real on-disk location
   is wherever `ember-native` itself is installed (e.g. under a workspace's
   own `node_modules/.pnpm` store) - a directory that has no reason to have
   `nativescript` reachable from it under pnpm's strict, non-hoisted
   `node_modules` layout (confirmed empirically: `require.resolve('nativescript/
   package.json')` from inside `ember-native/`'s own package directory throws
   `Cannot find module`). Fixed by resolving every `nativescript/*` require via
   `require.resolve(request, { paths: [process.cwd()] })` instead - this
   finds it starting from the *invoking project's* working directory (e.g.
   `demo-app/`, which does declare `nativescript` as a real dependency),
   exactly where `nativescript`/`tns` itself would be resolved from if invoked
   directly. Confirmed working: from `demo-app/`, `require.resolve('nativescript/
   package.json', { paths: [process.cwd()] })` resolves correctly; from
   `ember-native/`, the same call still (correctly) throws - this binary must
   be run with the consuming app's directory as `cwd`, same constraint
   `nativescript` itself already has.
2. **Feature-detects the upstream fix instead of hardcoding a version
   cutoff.** Since the fix already exists upstream in prerelease form (see
   above) and could ship as a stable release at any point a consuming app
   might upgrade to, the wrapper reads `compileWithoutWatch`'s own source
   (`.toString()`) and checks whether it already contains
   `copyViteBundleToNative`; if so, it skips installing the monkeypatch
   entirely (patching on top of an already-fixed method would copy twice).
   This means the exact same published binary keeps working correctly - as a
   transparent pass-through - once/if a consuming app upgrades to whatever
   `nativescript` version first ships the real fix, with no new release of
   `ember-native` required to "turn off" the workaround.

`demo-app/package.json`'s `run`/`test`/`build`/`debug-test`/`debug`/
`prepare-android` scripts and both CLI-invoking steps in
`.github/workflows/app-test.yml` were switched from `node scripts/
nativescript-cli.js <args>` to `pnpm exec ember-native-nativescript <args>`
(`ember-native-nativescript` resolves to `ember-native`'s new bin via pnpm's
workspace `link:` symlink, so `demo-app` picking it up requires nothing beyond
the existing `pnpm install`/`ember-native`-build step CI already runs first).
`demo-app/scripts/nativescript-cli.js` was deleted.

**Verified**: `pnpm --filter ember-native build` (rollup + tsc) produces
`ember-native/dist/utils/nativescript-cli.js`; a subsequent `pnpm install`
correctly links `demo-app/node_modules/.bin/ember-native-nativescript` to it
(confirmed it fails to link with a clear `ENOENT` before the addon is built,
and succeeds after - expected, matches this repo's existing "build the addon
first" CI ordering). `pnpm exec ember-native-nativescript --version` from
`demo-app/` prints `9.0.6` and checks for updates, i.e. runs the real CLI.
A fully clean `rm -rf .ns-vite-build tmp platforms && pnpm exec
ember-native-nativescript build android` from `demo-app/` succeeds end to end
and produces real `bundle.mjs`/`vendor.mjs` content in
`platforms/android/app/src/main/assets/app/` (not an empty directory, the
original bug's symptom) - confirming the monkeypatch still applies correctly
through its new resolution path against the real (still-unfixed) installed
`nativescript@9.0.6`. `pnpm --filter ember-native lint` passes on the new
file; `pnpm --filter demo-app lint:js` reproduces exactly the same 7
pre-existing, already-documented errors, no new ones.
