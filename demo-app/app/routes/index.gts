import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to';
import { service } from "@ember/service";
import Component from "@glimmer/component";



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
                <LinkTo @route='tabs' @transitionName='explode' @transitionDuration={{1000}}>
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
