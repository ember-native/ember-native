ember-native
==============================================================================

use the Ember framework with Nativescript 


`ember-native-nativescript` binary
------------------------------------------------------------------------------

This package installs a `ember-native-nativescript` binary alongside the
`nativescript` CLI it depends on. It's a thin wrapper: it forwards all
arguments unchanged to `nativescript`/`tns`, but also works around a real bug
in `nativescript`'s CLI (confirmed still present as of `nativescript@9.0.6`,
the latest stable release at the time of writing - see
[`NativeScript/nativescript-cli`](https://github.com/NativeScript/nativescript-cli)):
`nativescript build`/`nativescript test` never copy `@nativescript/vite`'s
build output into the native platform project, silently producing an empty
or stale native app. Only `nativescript debug`'s watch-mode path happens to
copy it correctly. No tracking issue could be found upstream for this bug at
the time of writing.

If your app uses `@nativescript/vite`, point your `package.json` scripts at
`ember-native-nativescript` instead of `nativescript`/`tns` directly - it
otherwise behaves identically, and becomes a no-op the moment upstream ships
a real fix (detected automatically, not hardcoded to a version). For example:

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

`ember-native-nativescript` resolves `nativescript` the same way `nativescript`
itself would: from the current working directory. Run it from your app's
project root (the directory that depends on `nativescript`), the same place
you'd run `nativescript` from - not from wherever `ember-native` happens to be
installed. This also means it won't work as expected if invoked through a task
runner that changes `cwd` (e.g. Nx or Turborepo's `--cwd`) to somewhere without
`nativescript` in scope.


Setting up an app's `vite.config.ts`
------------------------------------------------------------------------------

An ember-native app needs `@nativescript/vite`'s own config merged together
with a handful of Ember/Embroider- and ember-native-specific plugins and
alias fixes. Rather than hand-rolling that merge (subtle to get right - see
`demo-app/vite.config.ts` before this helper existed, in git history, for
what that used to look like), use `ember-native/utils/nativescript-vite.config.js`:

```ts
// vite.config.ts
import { createRequire } from 'node:module';
import { defineConfig, mergeConfig } from 'vite';
import { typescriptConfig } from '@nativescript/vite';
import { hmr } from 'ember-vite-hmr';
import configureNativeScriptVite from 'ember-native/utils/nativescript-vite.config.js';

const require = createRequire(import.meta.url);

export default defineConfig(({ mode }) =>
  configureNativeScriptVite({
    mode,
    mergeConfig,
    typescriptConfig,
    hmr,
    require,
    entry: require.resolve('./boot-app.js'),
  }),
);
```

`mergeConfig`/`typescriptConfig`/`hmr`/`require` are passed through from your
own imports (rather than re-imported inside the helper) so the exact `vite`
instance driving your dev server is always the one used - see the helper's
own JSDoc for why that matters. `entry` points at whatever file your app's
`app/boot.js` should actually run (see `demo-app/app/boot.js` for the
bare-specifier-alias dispatcher pattern this enables).

Customize via extra options: `vendorExclude` (extra package names to skip in
`@nativescript/vite`'s HMR vendor-bundle step - safe to over-list), `hmrHost`
(override the Android-emulator HMR host guess for a real device or LAN dev
server), `babel` (forwarded into the addon's own babel plugin config),
`plugins` (extra Vite plugins), and `extend` (any other Vite config,
merged in last). A one-shot bundler config that never runs the dev server
(e.g. a Vite-only `nativescript test` config) just omits `hmr`/`require` -
see `demo-app/vite.test.config.ts` for a full example that also adds its own
test-only plugins, aliases, and `define`s via `plugins`/`extend`.


Bootstrapping an app
------------------------------------------------------------------------------

An ember-native app needs a handful of one-time wiring steps that are the
same for every app and easy to get subtly wrong (see git history for
`demo-app/app/native/setup-ember-native.ts`/`app/app.js` before these helpers
existed). `ember-native` exports three functions/classes to cover them - the
rest of each file below is genuinely app-specific and stays yours to write.

`app/native/setup-ember-native.ts` (imported first, before anything else that
touches the DOM or Ember) just needs:

```ts
import { setupEmberNativeApp } from 'ember-native';
import { ENV } from '~/config/env';

setupEmberNativeApp(ENV);
```

`setupEmberNativeApp` installs ember-native's DOM shim, wires up Chrome
DevTools support in dev builds only (tree-shaken out of release builds), and
sets `ENV.rootElement` to the app's root native view.

`app/app.js`'s `App` class extends `NativeApplication` instead of
`@ember/application` directly - it's the same class otherwise, with your own
`rootElement`/`modulePrefix`/`Resolver`/etc:

```js
import { NativeApplication } from 'ember-native';

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
import './setup-ember-native';
import './register-elements'; // your own custom native elements, if any
import App from '../app';
import ENV from '~/config/env';
import { createNativeApplication } from 'ember-native';

export default createNativeApplication(App, ENV);
```


Testing page-rooted components
------------------------------------------------------------------------------

A NativeScript `Page` only gets a working `.frame` (and, by extension, a
working `<action-bar>`) when it is a direct native child of a `<frame>`
element - see `Page.frame`/`isFrame` in `@nativescript/core`, and
`ember-native/src/dom/native/FrameElement.ts` for how `<frame>` wires a
`<page>` child up via `Frame.navigate()`. Every top-level route/screen
component in an ember-native app renders a `<page>` (see
`demo-app/app/routes/index.gts`), but `setupRenderingTest` from `ember-qunit`
never provides a `<frame>` ancestor - rendering such a component directly
crashes with `TypeError: page.frame._getNavBarVisible is not a function` the
moment its `<action-bar>` loads.

Glimmer templates are compiled statically, so a component's real template
can't be introspected or have its `<page>` wrapper stripped at runtime.
Instead, use `withTemplateForTest` (from
`ember-native/test-support/with-template-for-testing`) to render a test-only
double of the component with a substitute template - the same content minus
the `<page>`/`<action-bar>` wrapper - while keeping the original class's
services, args, and lifecycle intact:

`withTemplateForTest` takes a component class, so a route module built with
`ember-routable-component`'s `RoutableComponentRoute()` needs to export the
`<page>`-rooted component itself, not just the generated `Route` (see
`demo-app/app/routes/index.gts`, which exports both `Page` and the
`IndexRoute` built from it):

```gts
// my-app/routes/index.gts
import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';

export class Page extends Component {
  <template>
    <page>
      <action-bar title="Ember Nativescript Examples"></action-bar>
      <stack-layout>
        {{! ... }}
      </stack-layout>
    </page>
  </template>
}

export default class IndexRoute extends RoutableComponentRoute(Page) {}
```

```gts
import { setupRenderingTest } from 'my-app/tests/helpers';
import { render } from '@ember/test-helpers';
import { withTemplateForTest } from 'ember-native/test-support/with-template-for-testing';
import { Page as IndexPage } from 'my-app/routes/index';

QUnit.module('Integration | Component | index page', function (hooks) {
  setupRenderingTest(hooks);

  QUnit.test('renders the list of examples', async function (assert) {
    const TestableIndexPage = withTemplateForTest(IndexPage, <template>
      <stack-layout>
        {{! ...same content as IndexPage's template, minus <page>/<action-bar> }}
      </stack-layout>
    </template>);

    await render(<template><TestableIndexPage /></template>);
    assert.dom(this.element).containsText('List View');
  });
});
```

This only exercises the component's non-`<page>` content - it can't verify
`<action-bar>` rendering or real navigation-frame behavior. Test those
end-to-end instead, via `setupApplicationTest` + `visit()` (see
`demo-app/app/tests/integration/main-page-test.ts`), which boots the real
app and its native `Application`.


Reading text content in tests
------------------------------------------------------------------------------

`ViewNode#textContent` (`ember-native/src/dom/nodes/ViewNode.ts`) reads each
leaf element's current `text`/`html` via `getAttribute`, which for a native
element (`NativeElementNode#getAttribute`) reads the underlying native
view's real, current property value - there is no microtask, native layout
pass, or debounced write anywhere between a `text={{...}}` binding (or a
child `TextNode` update) and the value `textContent` sees; the update is
synchronous JS all the way down to the native property assignment. So
`await click(...)`/`await rerender()` (which just await `settled()`) are
always enough - `.textContent` does not need `getAttribute('text')` as a
workaround after a tap or other interaction.

Two things can still make `.textContent` look wrong if you're not expecting
them, neither of which is a staleness bug:

- Leaf contents are joined with a single space and empty/falsy segments are
  dropped, so e.g. `<button>counter: {{state.counter}}</button>` reads back
  as `'counter:  0'` (two spaces - `'counter: '` and `'0'` are separate text
  nodes) rather than `'counter: 0'`.
- `getAttribute` returns `null` for an element whose `nativeView` isn't set
  (e.g. mid-teardown, or a recycled `ListView`/`RadListView` row between
  native recycle callbacks) - that element silently contributes nothing to
  `textContent` rather than throwing, so a query that happens to hit such an
  element mid-recycle reads back a shorter string, not necessarily an
  outright empty one.


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
