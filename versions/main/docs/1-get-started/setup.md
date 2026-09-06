# Setup a new ember-native project

The quickest way to start is to clone
[`ember-native-demo`](https://github.com/ember-native/ember-native-demo),
which already has everything below wired up. This page documents what that
template actually does, for adapting an existing app or understanding what's
going on.

## `vite.config.ts`

An ember-native app needs `@nativescript/vite`'s own config merged together
with a handful of Ember/Embroider- and ember-native-specific plugins and
alias fixes. Use `ember-native/utils/nativescript-vite.config.js` rather than
hand-rolling that merge:

```ts
// vite.config.ts
import { createRequire } from "node:module";
import { defineConfig, mergeConfig } from "vite";
import { typescriptConfig } from "@nativescript/vite";
import { hmr } from "ember-vite-hmr";
import configureNativeScriptVite from "ember-native/utils/nativescript-vite.config.js";

const require = createRequire(import.meta.url);

export default defineConfig(({ mode }) =>
  configureNativeScriptVite({
    mode,
    mergeConfig,
    typescriptConfig,
    hmr,
    require,
    entry: require.resolve("./boot-app.js"),
  }),
);
```

`mergeConfig`/`typescriptConfig`/`hmr`/`require` are passed through from your
own imports (rather than re-imported inside the helper) so the exact `vite`
instance driving your dev server is always the one used. `entry` points at
whatever file your app's `app/boot.js` should actually run.

Extra options: `vendorExclude` (extra package names to skip in
`@nativescript/vite`'s HMR vendor-bundle step), `hmrHost` (override the
Android-emulator HMR host guess for a real device or LAN dev server), `babel`
(forwarded into the addon's own babel plugin config), `plugins` (extra Vite
plugins), and `extend` (any other Vite config, merged in last).

## Bootstrapping the app

Three exports from `ember-native` cover the one-time wiring every app needs;
everything else stays app-specific.

`app/native/setup-ember-native.ts` (imported first, before anything else that
touches the DOM or Ember):

```ts
import { setupEmberNativeApp } from "ember-native";
import { ENV } from "~/config/env";

setupEmberNativeApp(ENV);
```

`setupEmberNativeApp` installs ember-native's DOM shim, wires up Chrome
DevTools support in dev builds only, and sets `ENV.rootElement` to the app's
root native view.

`app/app.js`'s `App` class extends `NativeApplication` instead of
`@ember/application` directly - it's the same class otherwise, with your own
`rootElement`/`modulePrefix`/`Resolver`/etc:

```js
import { NativeApplication } from "ember-native";

export default class App extends NativeApplication {
  rootElement = ENV.rootElement;
  autoboot = ENV.autoboot;
  modulePrefix = ENV.modulePrefix;
  podModulePrefix = `${ENV.modulePrefix}/pods`;
  Resolver = Resolver.withModules(compatModules);
}
```

`app/native/main.ts` (your NativeScript entry point) creates and registers
the app instance via `createNativeApplication`:

```ts
import "./setup-ember-native";
import "./register-elements"; // your own custom native elements, if any
import App from "../app";
import ENV from "~/config/env";
import { createNativeApplication } from "ember-native";

export default createNativeApplication(App, ENV);
```

See [Integrate plugin elements](../2-dom/integrate-plugin-elements) for what
`register-elements.ts` looks like.

## Chrome DevTools support

`setupEmberNativeApp` already wires up Chrome DevTools protocol support for
you, so most apps don't need to think about this at all. It only matters if
you have a custom entry point that doesn't go through `setupEmberNativeApp`
(or you want to trigger inspector support separately, e.g. later than app
boot) and need to call it yourself - use `maybeSetupInspectorSupport`:

```ts
import { maybeSetupInspectorSupport } from "ember-native";
import { ENV } from "~/config/env";

maybeSetupInspectorSupport(ENV);
```

This is a no-op in release builds, tree-shaken out of the bundle entirely
rather than merely skipped at runtime - always prefer this helper over
importing `ember-native/setup-inspector-support` directly, since that
module's own export is only safe behind this exact dynamic-import pattern.

## The `ember-native-nativescript` binary

This package also installs an `ember-native-nativescript` binary alongside
the `nativescript` CLI it depends on. It's a thin wrapper that forwards all
arguments unchanged to `nativescript`/`tns`, but works around a bug where
`nativescript build`/`nativescript test` never copy `@nativescript/vite`'s
build output into the native platform project, silently producing an empty
or stale native app (only `nativescript debug`'s watch-mode path copies it
correctly). If your app uses `@nativescript/vite`, point your `package.json`
scripts at `ember-native-nativescript` instead of `nativescript`/`tns`
directly:

```json
{
  "scripts": {
    "run": "ember-native-nativescript debug android",
    "test": "ember-native-nativescript test android --no-watch",
    "build": "ember-native-nativescript build android",
    "debug": "ember-native-nativescript debug android --debug-brk",
    "prepare-android": "ember-native-nativescript prepare android"
  }
}
```

Run it from your app's project root (the directory that depends on
`nativescript`), the same place you'd run `nativescript` from.
