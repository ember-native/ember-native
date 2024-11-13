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
            <action-bar title="Ember Nativescript Examples">
            </action-bar>
            <stack-layout>
                <LinkTo @route='list-view' @transitionName='fade'>
                    List View
                </LinkTo>
                <LinkTo @route='rad-list-view' @transitionName='slideLeft'>
                    Rad List View
                </LinkTo>
                <LinkTo @route='tabs' @transitionName='explode'>
                    Tabs
                </LinkTo>
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
