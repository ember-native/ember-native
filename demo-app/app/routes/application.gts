import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';
import InspectorSupport from 'ember-native/components/InspectorSupport';


class RoutableComponent extends Component {
    <template>
        <InspectorSupport >
            {{outlet}}
        </InspectorSupport>
    </template>
}


export default class ApplicationRoute extends RoutableComponentRoute(RoutableComponent) {
    activate() {
        console.log('activate');
    }
}
