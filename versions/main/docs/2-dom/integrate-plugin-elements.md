# integrate plugin elements 

to use elements provided by plugins you have to do this steps:

1. import them and register

```js
import { registerNativeElement } from 'ember-native/dom/setup-registry';
import { RadListView } from 'nativescript-ui-listview';
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';


registerNativeElement('RadListView', () => RadListView);
registerNativeElement('RadSideDrawer', () => RadSideDrawer);
```

notice that the registration uses the camel case name.
but in the templates you will have to use the dash form.


2. setup support for glint in globals.d.ts
```js
type ViewBase = import('@nativescript/core').ViewBase;
type NativeElementNode<T extends ViewBase> =
  import('../dom/native/NativeElementNode').default<T>;

interface HTMLElementTagNameMap {
  'rad-list-view': NativeElementNode<import('nativescript-ui-listview').RadListView>;
  'rad-side-drawer': NativeElementNode<import('nativescript-ui-sidedrawer').RadSideDrawer>;
}
```
