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

### `--no-watch` is required (a real upstream bug, not a preference)

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
Whichever of these two reproduces the crash pins down which of "the
plugin's injected content" vs. "the resolve.alias list" is the actual
cause (or, if *neither* crashes, the cause is specifically in
`test-helper.ts`'s real body - `ember-qunit`/`qunit-dom`/
`@valor/nativescript-websockets`/`setup-ember-native`/`NativeElementNode` -
and the "isolate test-helper.ts's real imports one at a time" plan from
earlier in this section is the right next move after all, just with the
plugin explicitly held *absent* this time to avoid the contamination this
update ran into). Each iteration is one `vite build` (~3min) + the fast
gradlew loop (~20-30s) - see the earlier "Debugging technique" section for
the full loop and the stale-`platforms/`-directory pitfall.
