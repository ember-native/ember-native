# Glint

Glint is supported, you just need to import

- `import ember-native/types/glint`
- `import ember-native/types/globals`

to support elements coming from other plugins you need to register them - see
[Integrate plugin elements](../2-dom/integrate-plugin-elements) for the full
runtime registration + Glint type augmentation steps:

```ts
import type NativeElementNode from "ember-native/dom/native/NativeElementNode";

declare module "ember-native/dom/native-elements-tag-name-map" {
  interface NativeElementsTagNameMap {
    "rad-side-drawer": NativeElementNode<import("nativescript-ui-sidedrawer").RadSideDrawer>;
  }
}
```
