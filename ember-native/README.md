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
DevTools support in dev builds only via `maybeSetupInspectorSupport` (see
below), and sets `ENV.rootElement` to the app's root native view.

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


Chrome DevTools support
------------------------------------------------------------------------------

`setupEmberNativeApp` already wires up Chrome DevTools protocol support for
you, so most apps don't need to think about this at all. It only matters if
you have a custom entry point that doesn't go through `setupEmberNativeApp`
(or you want to trigger inspector support separately, e.g. later than app
boot) and need to call it yourself - use `maybeSetupInspectorSupport`:

```ts
import { maybeSetupInspectorSupport } from 'ember-native';
import { ENV } from '~/config/env';

maybeSetupInspectorSupport(ENV);
```

This is a no-op in release builds, tree-shaken out of the bundle entirely
rather than merely skipped at runtime. That distinction matters: the module
`maybeSetupInspectorSupport` loads under the hood
(`ember-native/setup-inspector-support`) statically imports
`@nativescript/core/debugger/webinspector-dom`, which throws the moment it's
evaluated on NativeScript's plain (non-`-with-inspector`) release runtime.
Because ES module imports are hoisted, wrapping a static `import` of that
module in a runtime `if (__DEV__)` check doesn't help - the import still runs
and crashes before the guard ever executes. `maybeSetupInspectorSupport`
performs the import as a dynamic `import()` internally, gated on
`import.meta.env.DEV`, so Rollup can prove the whole branch is dead code in a
production build and drop it instead of merely deferring it. Prefer this
helper over importing `ember-native/setup-inspector-support` directly -
that module's own `setupInspectorSupport` export is only safe behind this
exact dynamic-import pattern, and getting it wrong silently breaks every
release build that imports the module path at all, even unconditionally at
the top of an otherwise-unrelated file.


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


Page stacks - avoiding re-renders when navigating back and forth
------------------------------------------------------------------------------

NativeScript's own `Frame` keeps every navigated-to `Page` around in a native
backstack, so going back to one shows the same, already-laid-out native view
instead of recreating it. This app's routes don't render under a real
`<frame>` (see "Testing page-rooted components" above), so that behavior
isn't available for free - `PageStackOutlet` and `PageStack`/`PageStackView`
give you the equivalent for Ember-router-driven and manually-driven
navigation respectively, by keeping the relevant component(s) mounted and
only toggling `visibility` between them.

### Sub-routes, via `PageStackOutlet`

Ember never tears down a route's rendered output while any of its child
routes are active - the parent route's own component simply isn't destroyed
by entering a child route. What's missing without `PageStackOutlet` is
somewhere for the child's `<page>` to render other than replacing the
parent's: a bare `{{outlet}}` swaps the parent's content out to make room for
it. `PageStackOutlet` instead renders both, toggling which is visible, so
navigating into a child route and back is instant - the parent's `<page>`
was never re-rendered because it was never removed:

```gts
// routes/list-view.gts
import { PageStackOutlet } from 'ember-native/components/index';

class Page extends Component {
  <template>
    <PageStackOutlet @routeName='list-view'>
      <page>
        {{! ...the list-view route's own content... }}
      </page>
    </PageStackOutlet>
  </template>
}
```

```gts
// routes/list-view/item.gts - a child route of `list-view` above
class Page extends Component {
  <template>
    <page>
      {{! ...the item detail route's own content, including its own
           back button wired to the `history` service, e.g. via
           `demo-app/app/routes/list-view.gts`'s pattern... }}
    </page>
  </template>
}
```

`@routeName` must match the owning route's own name (`'list-view'`, not
`'list-view.item'`) - `PageStackOutlet` compares it against the router's
`currentRouteName` to decide whether a descendant route is active. This
composes for arbitrarily deep nesting: if `list-view.item` itself wraps its
own content in another `PageStackOutlet` (`@routeName='list-view.item'`), a
further child route stacks on top of it the same way, independently of the
`list-view` outlet above it. See `demo-app/app/routes/list-view.gts` and
`demo-app/app/routes/list-view/item.gts` for a complete example.

### Manual stacks, via `PageStack`/`PageStackView`

For navigation that isn't router-driven (e.g. a wizard, or master/detail
inside a single route), use the `PageStack` class directly: it's a small
tracked stack of entries that, once pushed, stay mounted until explicitly
evicted - only `activeKey` changes when navigating back and forth.
`PageStackView` renders one for you:

```gts
import { PageStackView } from 'ember-native/components/index';
import PageStack from 'ember-native/page-stack';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import StepOne from './step-one';

class Wizard extends Component {
  stack = new PageStack();
  push = (content, key) => this.stack.push(content, key);
  back = () => this.stack.pop();

  <template>
    <PageStackView @stack={{this.stack}} />
    <button {{on 'tap' (fn this.push StepOne 'step-one')}}>Start</button>
  </template>
}
```

An entry's `content` is anything invokable as a component - a bare component
class (as pushed above, with no args), or, for a step that needs args bound
in, a curried component built with the `{{component}}` template helper at
the call site, e.g. from `StepOne`'s own template (`@push` passed down from
`Wizard` above):

```gts
<button {{on 'tap' (fn @push (component StepTwo onDone=@onDone) 'step-two')}}>
  Next
</button>
```

`PageStackView` renders `<entry.content />` for every entry ever pushed,
showing only the one whose `key` matches `stack.activeKey`. `pop()`
reactivates the previous entry without destroying either one; `evict(key)`
removes an entry for good, so pushing it again later renders it fresh.

### A caveat: querying by tag name across a stack

Once more than one page is mounted at a time (either kind of stack),
`document`/`ViewNode` lookups that search the whole tree by tag - e.g.
`ENV.rootElement.getElementByTagName('actionbar')` - can match the
*collapsed* page's element instead of the visible one, since they don't
filter on `visibility`. Prefer `getElementById` scoped to a known page (give
each stacked `<page>` a distinct `id`) over a blanket tag search once a
route uses `PageStackOutlet` - see `demo-app/app/tests/integration/list-view-stack-test.ts`.


Reading text content in tests
------------------------------------------------------------------------------

`ViewNode#textContent` (`ember-native/src/dom/nodes/ViewNode.ts`) reads each
leaf element's current `text`/`html` via `getAttribute`, which for a native
element (`NativeElementNode#getAttribute`) reads the underlying native
view's real, current property value - there is no microtask, native layout
pass, or debounced write anywhere between a `text={{...}}` binding (or a
child `TextNode` update) and the value `textContent` reads: a property
write (NativeScript core's `Property.set`) always updates its JS-side
cache, the thing `getAttribute`/`textContent` actually read, synchronously.
So `await click(...)`/`await rerender()` (which just await `settled()`) are
always enough - `.textContent` does not need `getAttribute('text')` as a
workaround after a tap or other interaction.

A few things can still make `.textContent` look wrong if you're not
expecting them, none of which is a staleness bug:

- Leaf contents are joined with a single space and empty/falsy segments are
  dropped, so e.g. `<button>counter: {{state.counter}}</button>` reads back
  as `'counter:  0'` (two spaces - `'counter: '` and `'0'` are separate text
  nodes) rather than `'counter: 0'`.
- Whitespace *between* elements in a template is itself a real, non-empty
  text node and gets counted the same way: `<button>a</button>` and
  `<label ... />` written on separate, indented lines read back with that
  literal newline/indentation between them (e.g. `'a \n  b'`). Put sibling
  elements on one line, with no whitespace between them, when asserting on
  their combined `textContent`.
- `getAttribute` returns `null` for an element whose `nativeView` isn't set
  (e.g. mid-teardown - `NativeElementNode`'s `ActionBar`/`ActionItem`
  removal path has a case where `actionItems` is nulled out before removal
  fires, see `onRemovedChild` in `NativeElementNode.ts`) - that element
  silently contributes nothing to `textContent` rather than throwing, so a
  query that happens to hit such an element mid-teardown reads back a
  shorter string, not necessarily an outright empty one.


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
