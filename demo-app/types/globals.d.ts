import 'ember-native/types/glint'
import 'ember-native/types/globals'
type ViewBase = import('@nativescript/core').ViewBase;
type NativeElementNode<T extends ViewBase> =
  import('../dom/native/NativeElementNode').default<T>;

interface HTMLElementTagNameMap {
  'rad-list-view': NativeElementNode<import('nativescript-ui-listview').RadListView>;
  'rad-side-drawer': NativeElementNode<import('nativescript-ui-sidedrawer').RadSideDrawer>;
}
