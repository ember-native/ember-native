# Glint

Glint is supported, you just need to import

- `import ember-native/types/glint`
- `import ember-native/types/globals`


to support elements coming from other plugins you need to register them

```ts
type ViewBase = import('@nativescript/core').ViewBase;
type NativeElementNode<T extends ViewBase> =
  import('../dom/native/NativeElementNode').default<T>;
interface HTMLElementTagNameMap {
  'rad-list-view': NativeElementNode<import('nativescript-ui-listview').RadListView>;
  'rad-side-drawer': NativeElementNode<import('nativescript-ui-sidedrawer').RadSideDrawer>;
}
```
