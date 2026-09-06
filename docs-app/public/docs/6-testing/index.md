# Testing page-rooted components

A NativeScript `Page` only gets a working `.frame` (and, by extension, a
working `<action-bar>`) when it is a direct native child of a `<frame>`
element. Every top-level route/screen component in an ember-native app
renders a `<page>`, but `setupRenderingTest` from `ember-qunit` never
provides a `<frame>` ancestor - rendering such a component directly crashes
with `TypeError: page.frame._getNavBarVisible is not a function` the moment
its `<action-bar>` loads.

Glimmer templates are compiled statically, so a component's real template
can't be introspected or have its `<page>` wrapper stripped at runtime.
Instead, use `withTemplateForTest` (from
`ember-native/test-support/with-template-for-testing`) to render a test-only
double of the component with a substitute template - the same content minus
the `<page>`/`<action-bar>` wrapper - while keeping the original class's
services, args, and lifecycle intact.

`withTemplateForTest` takes a component class, so a route module needs to
export the `<page>`-rooted component itself, not just the generated `Route`:

```gts
// my-app/routes/index.gts
import RoutableComponentRoute from "ember-routable-component";
import Component from "@glimmer/component";

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
import { setupRenderingTest } from "my-app/tests/helpers";
import { render } from "@ember/test-helpers";
import { withTemplateForTest } from "ember-native/test-support/with-template-for-testing";
import { Page as IndexPage } from "my-app/routes/index";

QUnit.module("Integration | Component | index page", function (hooks) {
  setupRenderingTest(hooks);

  QUnit.test("renders the list of examples", async function (assert) {
    const TestableIndexPage = withTemplateForTest(
      IndexPage,
      <template>
        <stack-layout>
          {{! ...same content as IndexPage's template, minus <page>/<action-bar> }}
        </stack-layout>
      </template>,
    );

    await render(<template><TestableIndexPage /></template>);
    assert.dom(this.element).containsText("List View");
  });
});
```

This only exercises the component's non-`<page>` content - it can't verify
`<action-bar>` rendering or real navigation-frame behavior. Test those
end-to-end instead, via `setupApplicationTest` + `visit()`, which boots the
real app and its native `Application`.

## Reading text content in tests

`ViewNode#textContent` reads each leaf element's current `text`/`html`
directly from the underlying native view - there is no microtask, native
layout pass, or debounced write between a `text={{...}}` binding (or a child
text-node update) and the value `textContent` reads. So `await
click(...)`/`await rerender()` (which just await `settled()`) are always
enough - `.textContent` never needs a workaround after a tap or other
interaction.

A few things can still make `.textContent` look wrong if you're not
expecting them, none of which is a staleness bug:

- Leaf contents are joined with a single space and empty/falsy segments are
  dropped, so e.g. `<button>counter: {{state.counter}}</button>` reads back
  as `'counter:  0'` (two spaces - `'counter: '` and `'0'` are separate text
  nodes) rather than `'counter: 0'`.
- Whitespace _between_ elements in a template is itself a real, non-empty
  text node and gets counted the same way: `<button>a</button>` and
  `<label ... />` written on separate, indented lines read back with that
  literal newline/indentation between them (e.g. `'a \n  b'`). Put sibling
  elements on one line, with no whitespace between them, when asserting on
  their combined `textContent`.
- Reading an attribute off an element whose native view isn't currently set
  (e.g. mid-teardown, or a `ListView`/`RadListView` row between native
  recycle callbacks) silently contributes nothing rather than throwing, so a
  query that happens to hit such an element mid-teardown reads back a
  shorter string, not necessarily an outright empty one.
