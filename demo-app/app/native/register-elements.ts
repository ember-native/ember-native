import { registerNativeElement } from 'ember-native/dom/setup-registry';
import { RadListView } from 'nativescript-ui-listview';
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';


registerNativeElement('RadListView', () => RadListView);
registerNativeElement('RadSideDrawer', () => RadSideDrawer);
