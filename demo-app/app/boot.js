// `@nativescript/vite` always builds whatever `package.json`'s `main` field
// points to (this file) - unlike webpack, which lets
// `@nativescript/unit-test-runner`'s own `nativescript.webpack.js` hook
// replace the entire webpack `entry` with `test.js` for test builds, Vite
// has no equivalent per-build entry override. Instead, this file stays a
// tiny, always-static dispatcher: the bare `demo-app-entry` specifier is
// aliased differently per Vite config - `vite.config.ts` (real app builds)
// points it at `../boot-app.js`, `vite.test.config.ts` (`nativescript test
// android`) points it at `../boot-test.js`. Both are plain static imports,
// so whichever one is selected is evaluated synchronously as part of this
// module's own linking - no dynamic `import()` involved. This matters for
// the test build specifically: `@nativescript/unit-test-runner`'s
// `Application.run({ moduleName: "bundle-app-root" })` (in `boot-test.js`'s
// import graph) registers `NativeScriptActivity`'s JS-extend wrapper, and
// Android tries to instantiate that Activity essentially as soon as the
// process starts - a dynamic import here previously deferred that
// registration into a later microtask, after Android had already tried and
// failed ("Failed to create JavaScript extend wrapper for class
// 'com/tns/NativeScriptActivity'"). See VITE_MIGRATION_NOTES.md's
// "eager-vs-lazy-import problem" section for the full diagnostic history.
//
// `boot-app.js`/`boot-test.js` deliberately live one level up, *outside*
// `app/` (unlike this file, which must stay under `app/` to satisfy
// NativeScript's own `appPath`/`main` convention) - Ember CLI's classic
// module-compat registry (`Resolver.withModules(...)`) eagerly imports
// *every* file under `app/` for its AMD-style namespace wrapper,
// independently of this alias and of which Vite config is active. With
// both real-content files sitting there instead of just this dispatcher,
// that registry was separately, unconditionally importing both of them in
// every build - running `boot-app.js`'s `NativeApplication.run()` a second
// time on top of `boot-test.js`'s test-runner-triggered
// `Application.run({ moduleName: ... })` during test builds (crashing
// module evaluation), and pulling `boot-test.js`'s entire qunit/ember-qunit
// dependency graph into production builds. Moving both out of `app/`
// removes them from that scan entirely - this dispatcher importing one of
// them by bare specifier is the only real reference left in either case.
//
// `@nativescript/vite`'s own generated entry (`main-entry.js`) registers
// `NativeScriptActivity`'s JS-extend wrapper via a fire-and-forget dynamic
// `import('@nativescript/core/ui/frame/activity.android.js?ns-keep')`,
// deferred to a `launchEvent` listener / `setTimeout(..., 0)` - an
// inherently racy mechanism (Android's own Activity-launch step can win the
// race before that deferred callback ever runs, reproducibly for a large
// enough JS bundle - "Failed to create JavaScript extend wrapper for class
// 'com/tns/NativeScriptActivity'"). Importing the same module here too,
// statically, forces Rollup to register it synchronously as part of this
// file's own linking - well before that `setTimeout(0)` can fire - so the
// class exists no matter how the race would've gone. The framework's own
// deferred import still runs afterwards; re-importing an already-evaluated
// ES module is a no-op, not a double registration. `?ns-keep` matches
// `main-entry.js`'s own specifier so Rollup canonicalizes both references
// to the same module instead of tree-shaking this one away as unused (its
// exports are genuinely unused - only the module's own side effect of
// registering the class matters).
import '@nativescript/core/ui/frame/activity.android.js?ns-keep';
import 'demo-app-entry';
