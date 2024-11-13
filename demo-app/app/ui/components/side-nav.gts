import Component from '@glimmer/component';
import { on } from '@ember/modifier'
import { ref } from '~/ui/modifiers/ref';
import type NativeElementNode from 'ember-native/dom/native/NativeElementNode';
import type { RadSideDrawer }  from 'nativescript-ui-sidedrawer';

export interface SideNavInterface {
    Args: {

    }
}


export default class SideNav extends Component<SideNavInterface> {
    declare drawer: NativeElementNode<RadSideDrawer>;

    onCloseDrawerTap = () => {
        this.drawer.nativeView.closeDrawer();
    }

    <template>
        <rad-side-drawer gesturesEnabled={{true}} {{ref this 'drawer'}}>
            <rad-side-drawer.drawerContent>
                <stack-layout class="sideStackLayout">
                    <stack-layout class="sideTitleStackLayout">
                        <label>Navigation Menu</label>
                    </stack-layout>
                    <stack-layout class="sideStackLayout">
                        <label class="sideLabel sideLightGrayLabel">Primary</label>
                        <label class="sideLabel">Social</label>
                        <label class="sideLabel">Promotions</label>
                        <label class="sideLabel sideLightGrayLabel">Labels</label>
                        <label class="sideLabel">Important</label>
                        <label class="sideLabel">Starred</label>
                        <label class="sideLabel">Sent Mail</label>
                        <label class="sideLabel">Drafts</label>
                    </stack-layout>
                    <label text="Close Drawer" color="lightgray" padding="10" style="horizontal-align: center" {{on
                        'tap' this.onCloseDrawerTap}} ></label>
                </stack-layout>
            </rad-side-drawer.drawerContent>
            <rad-side-drawer.mainContent>
                <stack-layout>
                    {{yield}}
                </stack-layout>
            </rad-side-drawer.mainContent>
        </rad-side-drawer>
    </template>
}
