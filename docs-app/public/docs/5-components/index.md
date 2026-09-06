# Ember Components

These components (`ember-native/components`) wrap native elements or native
navigation primitives to provide the bindings and functionality plain
templates can't express on their own:

- [`ListView`](./list-view-component) - a virtualized, native `ListView`
- [`RadListView`](./rad-list-view-component) - `nativescript-ui-listview`'s
  `RadListView`, with header/footer blocks
- `FrameOutlet` - lets a child route's `<page>` stack on top of a parent
  route's, without re-rendering the parent - see
  [Sub-routes and back navigation](../4-router-transitions/frame-outlet)
- `PageStackView` - renders a `PageStack` for non-router-driven navigation -
  see [Manual stacks](../4-router-transitions/page-stack)
- `InspectorSupport` - wraps a route tree in the `<frame>` that both
  router-driven navigation and Ember Inspector element selection need; wrap
  your application route/template's `{{outlet}}` in it once
  (`<InspectorSupport>{{outlet}}</InspectorSupport>`)
