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
- Coarse-grained route/controller/template hot reload
  (`src/services/vite-hot-reload.ts` +
  `src/instance-initializers/vite-hot-reload.ts`, formerly
  `webpack-hot-reload.ts`): **ported to Vite**, see "HMR service" below.

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
is *not* part of that active webpack bridging - see "Still open" item 3: it
has never actually been wired into `webpack.config.js`, for either bundler.)

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

## HMR service (`ember-native-todo.md` sub-task 2)

`src/services/webpack-hot-reload.ts` +
`src/instance-initializers/webpack-hot-reload.ts` were renamed to
`vite-hot-reload.ts` as part of the `a134ee4` commit (demo-app's webpack →
vite switch) and made dual-mode rather than webpack-only:

- The activation check is now
  `Boolean(import.meta.hot) || (typeof module !== 'undefined' &&
  Boolean(module.hot))` instead of a bare `module.hot` check, so the same
  service works whether the consuming app bundles with `@nativescript/vite`
  or the still-supported `@nativescript/webpack` path.
- The dynamic `__import()` call already used `import()` (with a
  `/* @vite-ignore */` hint, harmless under webpack), so no bundler-specific
  module-loading code needed to change.
- `package.json`'s `ember-addon.app-js` map and the exported
  `declare module '@ember/service'` registry entry were updated to
  `vite-hot-reload` alongside the rename (`service:ember-native/vite-hot-reload`).

This service implements *coarse-grained* HMR: on a route/controller/template
module replacement it clears the relevant container caches and calls
`router.refresh()`. It only activates in response to
`window.emberHotReloadPlugin.canAcceptNew()`/`.subscribe()` calls, which
currently come from nothing in the Vite path (see item 2 below) - so today
the ported service is correct and wired up, but dormant until something
drives it. It does not need further porting; it's already bundler-agnostic.

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
2. `ember-native/utils/hmr-loader.js` (the webpack *loader* that would
   append `import.meta.hot.accept()`/`canAcceptNew()` boilerplate to
   route/controller/template source, the only caller of
   `vite-hot-reload.ts`'s `canAcceptNew`) and `utils/babel-plugin.ts` (a
   template-AST transform gated on the same `EMBER_HMR_ENABLED` env var,
   using webpack-only `import.meta.webpackHot`) turn out to **already be
   dead code, independent of this migration** - `git log -S hmr-loader` /
   `-S babel-plugin` on the addon show neither file has ever been
   referenced from `utils/webpack.config.js`, `embroider-webpack-adapter.js`,
   or anywhere else since `hmr-loader.js` was added in `f5282b6` (Nov 2024).
   Fine-grained HMR was apparently never wired up even for webpack. Porting
   `hmr-loader.js`'s logic to a real Vite `transform` hook (keyed off
   `resourcePath`/`id` the way Rollup/Vite plugins expect, replacing the
   webpack-loader `this.resourcePath` signature) and wiring it into
   `utils/vite.config.js` would be new work, not a restoration - worth
   doing (`@nativescript/vite`'s own generic HMR still applies at the
   bundler level, independent of this) but scope it as its own item rather
   than assuming it's a regression to fix.
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
