# NativeScript upgrade notes (8.x → 9.x)

Technical reference for the `@nativescript/*` 8.x → 9.x upgrade
(`@nativescript/core` 8.9.7 → 9.0.20, `@nativescript/android` 8.9.1 → 9.0.5,
`@nativescript/types` 8.9.1 → 9.0.0, `@nativescript/webpack` 5.0.31 → 5.0.38,
`nativescript` CLI 9.0.1 → 9.0.6). Read this before attempting a similar
NativeScript major-version bump — every issue below cost significant time to
root-cause because the failures are silent (no build error, no thrown
exception) and only show up as a broken app on a real device/emulator.

## Why these bugs are hard to find

The common thread across almost everything below: webpack, Embroider, and
`@nativescript/webpack` disagree about whether a given `node_modules` file
is CommonJS or an ES module. When webpack misclassifies a plain CJS file as
ESM, it does **not** error — a `require('./sibling')` call is just an
ordinary, uninteresting `CallExpression` to the ESM parser (ESM modules
don't have `require` in scope), so nothing gets bundled, but nothing warns
either. The failure only surfaces at runtime, on-device, as a `require`
call reaching NativeScript's own module loader instead of
`__webpack_require__`, which does not have a relative-path module by that
name:

```
Failed to find module: './base64-vlq', relative to: app/
```

If you see this shape of error for a `node_modules` package after bumping
`@nativescript/core`, this is almost certainly the cause. There is no
generic fix — see "The ESM-misclassification bug" below.

## Prerequisite: verify locally before opening a PR

CI's Android job only runs `nativescript build android` (webpack + Gradle,
no emulator) plus a separate emulator test step. **A green webpack/Gradle
build does not mean the app actually boots.** All of the bugs in this
document compile cleanly and fail silently at runtime. You need a real
build + install + launch cycle:

```bash
cd demo-app
npx nativescript build android
adb uninstall org.nativescript.embernativedemo   # force a full reinstall,
                                                   # see "stale platforms
                                                   # dir" below
adb install platforms/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n org.nativescript.embernativedemo/com.tns.NativeScriptActivity
adb logcat -d --pid=<pid>   # or screencap -p to see the on-device error UI
```

An Android SDK + AVD (`~/Library/Android/sdk`, `emulator -list-avds`) is
usually already present on dev machines; boot one headless with
`emulator -avd <name> -no-window -no-audio -no-boot-anim` and wait for
`adb shell getprop sys.boot_completed` to return `1`.

## Issue 1: acorn / css-what named imports break at runtime

**Symptom:** webpack build fails with

```
export 'parse' (imported as 'parse') was not found in 'acorn' (module has no exports)
export 'parse' (imported as 'convertToCSSWhatSelector') was not found in 'css-what' (module has no exports)
```

**Cause:** `@nativescript/core` 9.x ships as `"type": "module"` and does
`import { parse } from 'acorn'` / `import { parse as X } from 'css-what'`.
Both `acorn` and `css-what` ship a UMD/CJS build behind their `require`
export condition; webpack cannot statically determine named exports from
that build (it's wrapped in an IIFE/factory pattern), so it reports the
import as missing entirely.

**Fix:** patch `@nativescript/core` (via `pnpm patch`) to use a namespace
import + destructure instead of a named import. A namespace import doesn't
require static named-export analysis — it just imports the whole module
object and destructures at runtime, which works for CJS interop
regardless of how webpack classified the file:

```diff
-import { parse } from 'acorn';
+import * as acorn from 'acorn';
+const { parse } = acorn;
```

See `patches/@nativescript__core@9.0.20.patch`. **This patch is pinned to
the exact `@nativescript/core` version** (`@nativescript/core@9.0.20` in
`pnpm.patchedDependencies`) — bumping the version again means regenerating
it (`pnpm patch @nativescript/core@<new-version>`, reapply the same diffs,
`pnpm patch-commit`).

## Issue 2: the ESM-misclassification bug (acorn/css-what/source-map-js)

Even after fixing Issue 1's *import syntax*, the underlying files (acorn's
CJS dist, css-what's CJS dist, and separately `source-map-js` pulled in
transitively by `css-tree`, the default Android/iOS CSS parser) still get
misclassified by webpack as ESM modules, breaking *their own internal*
`require('./sibling')` calls. Concretely:

```
Failed to find module: './types.js', relative to: app/       (css-what)
Failed to find module: './base64-vlq', relative to: app/     (source-map-js, via css-tree)
```

None of these packages are missing a proper CJS/ESM dual-package setup —
`css-what`'s `dist/commonjs/` even has its own `{"type":"commonjs"}`
override package.json, and `source-map-js` has no `"type"` field at all
(implicitly CJS). Something in this project's resolution graph (most
likely Embroider's resolver plugin, which assumes ESM/Vite-style
resolution) still causes webpack to parse these specific files as ESM.

**Fix:** force `type: 'javascript/auto'` on these specific files in
`ember-native/utils/webpack.config.js`, restoring webpack's normal
CommonJS-or-ESM content-sniffing:

```js
config.module.rule('acorn-cjs').test(/[/\\]acorn[/\\]dist[/\\]acorn\.js$/).type('javascript/auto');
config.module.rule('css-what-cjs').test(/[/\\]css-what[/\\]dist[/\\]commonjs[/\\].*\.js$/).type('javascript/auto');
config.module.rule('source-map-js-cjs').test(/[/\\]source-map-js[/\\]lib[/\\].*\.js$/).type('javascript/auto');
```

**Do not generalize this to all of `node_modules`.** An earlier attempt
used a single broad rule (`test: /\.js$/, include: /node_modules/`) and it
broke `@nativescript/core` itself — see Issue 3. Scope new rules to the
specific package path that's failing, confirmed via a real device/emulator
run, not by guessing.

If a future core bump surfaces this for a *new* package, diagnose it the
same way: look for `Failed to find module: './x', relative to: app/` in
the on-device exception screen, then check the compiled `vendor.js` for
`__webpack_require__.r(__webpack_exports__)` at the top of that module
(the marker webpack adds when it parses a file as ESM) followed by a
literal, unrewritten `require('./x')` call inside the module body.

## Issue 3: broad `javascript/auto` rules break `@nativescript/core`'s own bootstrap

`@nativescript/core/bundle-entry-points.js` relies on genuine ESM
side-effect-import ordering to guarantee `global.registerModule` exists
before it's called:

```js
// using import is important to ensure webpack keep it in order
import './globals';           // sets global.registerModule, among others
import * as coreUIModules from './ui/index';
...
global.registerModule('@nativescript/core/ui', () => coreUIModules);
```

Forcing `javascript/auto` broadly across all of `node_modules` (Issue 2's
fix, over-applied) breaks this and produces:

```
TypeError: global.registerModule is not a function
  at .../@nativescript/core/bundle-entry-points.js
```

**Lesson:** scope CJS/ESM interop fixes to the exact file(s) that need
them. `@nativescript/core`'s own module graph is ESM by design and
depends on webpack's real import-ordering guarantees.

## Issue 4: `import tslib from 'tslib'` resolves to `undefined`

**Symptom:** no build error, no visible crash. The app boots but
`global.registerModule` is never defined, `bundle-entry-points.js` fails
at runtime the same way as Issue 3 — but the root cause this time is
inside `@nativescript/core/globals/index.js` itself, not a webpack rule.

**Root cause:** `globals/index.js` does `import tslib from 'tslib'` (a
*default* import) and later does
`Object.getOwnPropertyNames(tslib)`. Under this project's CJS-bundle
webpack config, the default import of `tslib` resolves to `undefined`.
`Object.getOwnPropertyNames(undefined)` throws a `TypeError`, which is
thrown **synchronously during module evaluation** and aborts the rest of
`globals/index.js`'s top-level code — including the
`global.registerModule = function (...) {...}` assignment a few lines
later. Nothing in NativeScript's module loader surfaces this exception
distinctly; it just leaves `registerModule` undefined and execution moves
on to the next entry-array module, where the *symptom* (not the cause)
shows up.

This is the single hardest bug in this upgrade to diagnose, because the
actual throw site (`globals/index.js`) is two dependency edges away from
where the visible error is reported (`bundle-entry-points.js`), and
nothing in the crash log or webpack output points at `tslib`.

**How it was actually found:** bisecting by adding a `console.log` after
every single import statement in `globals/index.js`, rebuilding, and
reading `adb logcat` after each one — the log after the `tslib` import
step printed `typeof tslib = undefined`, and the *next* debug line (after
the property-enumeration loop) never printed. If you hit an unexplained
"registerModule is not a function" (or any other symptom where a
`global.*` assignment silently didn't happen) after this point in the
entry chain, use this exact technique: interleave `console.log` between
every top-level statement of the suspect module and re-run on-device.
Static reasoning about webpack's ESM/CJS interop here was unreliable and
repeatedly wrong; only runtime evidence resolved it.

**Fix:** patch `globals/index.js` to use a namespace import with a safe
default-or-namespace fallback, same pattern as Issue 1:

```diff
-import tslib from 'tslib';
+import * as _tslibNs from 'tslib';
+const tslib = _tslibNs && _tslibNs.default ? _tslibNs.default : _tslibNs;
```

Included in the same `patches/@nativescript__core@9.0.20.patch`.

## Issue 5: `.mjs` bundle output breaks the Android Static Binding Generator

**Symptom:** webpack build succeeds, but the Gradle build fails with:

```
Error executing Static Binding Generator: Couldn't find 'sbg-bindings.txt' bindings input file.
Most probably there's an error in the JS Parser execution.
```

**Cause:** `@nativescript/webpack` 5.x defaults to emitting an ESM bundle
(`.mjs` chunk files: `vendor.mjs`, `bundle.mjs`, `runtime.mjs`) for
Android/iOS now that `@nativescript/core` 9.x ships as `"type": "module"`.
The Android build toolchain's Static Binding Generator
(`js_parser.js`, shipped inside the `@nativescript/android` npm package,
invoked by a Java tool during the Gradle build to scan the JS bundle for
classes extending native Android types) only looks for `.js` files. With
`.mjs` output it silently finds and parses zero files, never writes
`sbg-bindings.txt`, and the downstream Java step then hard-fails because
that file doesn't exist.

**Fix:** `@nativescript/webpack` has a first-class, documented escape
hatch for this — set `env.commonjs = true` before `webpack.init(env)` in
`demo-app/webpack.config.js`. This switches the bundle back to CommonJS
(`.js`) output, which the Static Binding Generator understands, without
giving up on the rest of the 9.x upgrade. See
`@nativescript/webpack/dist/configuration/base.js` for the `env.commonjs`
branch if you need to verify this behavior against a future webpack
version.

## Issue 6: stale `platforms/android` directory reports the wrong runtime version

If you bump `@nativescript/android` but reuse an existing `platforms/`
directory (rather than a clean `nativescript build android` from
scratch), the Gradle build can silently keep using cached native runtime
artifacts from the *previous* version. The giveaway: `adb logcat` shows

```
TNS.Runtime: NativeScript Runtime Version 8.9.1, commit ...
```

even though `@nativescript/android` in `package.json` says `9.0.5`. This
produced a real (but ultimately irrelevant) `global.registerModule is not
a function` failure that looked identical to Issue 4's symptom and wasted
time until the runtime version mismatch was noticed in the logs.

**Fix:** `rm -rf demo-app/platforms` for a fully clean rebuild whenever
you bump `@nativescript/android`/`@nativescript/core`/`@nativescript/types`
majors, and confirm the logged `TNS.Runtime Version` matches the npm
package version before debugging anything else.

## Version bump summary

| Package | Before | After |
|---|---|---|
| `@nativescript/core` | 8.9.7 | 9.0.20 |
| `@nativescript/android` | 8.9.1 | 9.0.5 |
| `@nativescript/types` | 8.9.1 | 9.0.0 |
| `@nativescript/webpack` | 5.0.31 | 5.0.38 |
| `nativescript` (CLI) | 9.0.1 | 9.0.6 |

## Files touched

- `demo-app/package.json`, `ember-native/package.json` — version bumps.
- `demo-app/webpack.config.js` — `env.commonjs = true` (Issue 5).
- `ember-native/utils/webpack.config.js` — scoped `javascript/auto` rules
  for `acorn`/`css-what`/`source-map-js` (Issue 2), shared by every app
  that consumes this addon's webpack config, not just `demo-app`.
- `patches/@nativescript__core@9.0.20.patch` +
  `package.json#pnpm.patchedDependencies` — the `acorn`/`css-what`/`tslib`
  import-syntax patches (Issues 1 and 4).

## Known pre-existing issue found during manual testing (not caused by this upgrade)

Pressing the Android hardware back button from a route with no dynamic
segments (e.g. `index`) throws:

```
Error: More context objects were passed than there are dynamic segments for the route: index
```

This is in ember-native's own back-button/transition history handling
(`ember-native/history` service), not a NativeScript API. It reproduces
independently of this upgrade — the repo already has `add-back-transition`
and `fix-back-transition` branches addressing this area. In-app
navigation via `<LinkTo>` (the primary supported navigation path) works
correctly; only the raw Android back button triggers it. Flagged here for
whoever picks up that work next, not fixed as part of this upgrade.
