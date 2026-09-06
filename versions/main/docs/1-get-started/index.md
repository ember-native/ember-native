# ember-native

With `ember-native` you can use the power of Ember with NativeScript.

Some highlights are:

- `ListView` and `RadListView` components, backed by NativeScript's native,
  recycling list widgets
- Router-driven navigation through a real NativeScript `Frame` backstack,
  including native, animated push/pop transitions
- Manual (non-router) page stacks, via `PageStack`/`PageStackView`
- Glint support for templates, including native element tag names
- Ember Inspector support (element selection/highlighting) in dev builds

Get started with the [`ember-native-demo`](https://github.com/ember-native/ember-native-demo)
template, or see [Setup](./setup) for how an app wires up `ember-native`
itself.

<Callout>
  Only v2 Ember addons are supported natively. Classic (v1) addon compatibility
  - services, initializers, routes, templates, etc. - is provided by
  `@embroider/vite`'s `classicEmberSupport()`/`ember()` plugins, the same way
  it's wired up for any other Embroider + Vite app; see
  [Setup](./setup) for the full `vite.config.ts`.
</Callout>
