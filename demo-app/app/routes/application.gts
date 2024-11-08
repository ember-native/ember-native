import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';
import InspectorSupport from 'ember-native/components/InspectorSupport';
import { modifier } from 'ember-modifier';


const ref = modifier(function setRef(element, [context, key]) {
    // console.log('ref', element, context, key);
    context[key] = element;
})

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
