import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';
import {on} from "@ember/modifier";
import {service} from "@ember/service";
import {tracked} from "@glimmer/tracking";
import Component from "@glimmer/component";
import ListView from 'ember-native/components/ListView';
import RadListView from 'ember-native/components/RadListView';
import SideNav from "~/ui/components/side-nav.gts";



class Page extends Component {
    @service('ember-native/history') history;
    <template>
        <page>
            <action-bar title="Tabs">
            </action-bar>
            <stack-layout>
                <tab-view>
                    <tab-view-item title="First">
                        <label text="First Tab Content" textAlignment="center" verticalAlignment="center" />
                    </tab-view-item>
                    <tab-view-item title="Second">
                        <label text="Second Tab Content" textAlignment="center" verticalAlignment="center" />
                    </tab-view-item>
                    <tab-view-item title="Third">
                        <label text="Third Tab Content" textAlignment="center" verticalAlignment="center" />
                    </tab-view-item>
                    <tab-view-item title="Four">
                        <label text="Four Tab Content" textAlignment="center" verticalAlignment="center" />
                    </tab-view-item>
                </tab-view>
            </stack-layout>
        </page>
    </template>
}

// this will generate a Route class and use the provided template
export default class IndexRoute extends RoutableComponentRoute(Page) {
    activate() {
        console.log('activate');
    }
}
