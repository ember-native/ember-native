# integrate plugin elements

to use elements provided by plugins you have to do this steps:

1. import them and register

```js
import { registerNativeElement } from "ember-native/dom/setup-registry";
import { RadListView } from "nativescript-ui-listview";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";

registerNativeElement("RadListView", () => RadListView);
registerNativeElement("RadSideDrawer", () => RadSideDrawer);
```

notice that the registration uses the camel case name.
but in the templates you will have to use the dash form.

2. setup support for glint by augmenting `NativeElementsTagNameMap`

Glint resolves a template's native element tags through the
`NativeElementsTagNameMap` interface (`ember-native/dom/native-elements-tag-name-map`),
not the DOM's own `HTMLElementTagNameMap` - add your plugin's tags to it via
declaration merging, in a `.d.ts` file included by your app (e.g. `types/globals.d.ts`):

```ts
import type NativeElementNode from "ember-native/dom/native/NativeElementNode";

declare module "ember-native/dom/native-elements-tag-name-map" {
  interface NativeElementsTagNameMap {
    "rad-side-drawer": NativeElementNode<import("nativescript-ui-sidedrawer").RadSideDrawer>;
  }
}
```

`rad-list-view` doesn't need this step - it's already declared by
`ember-native` itself.
