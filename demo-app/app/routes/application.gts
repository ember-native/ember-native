import RoutableComponentRoute from 'ember-routable-component';
import InspectorSupport from 'ember-native/components/InspectorSupport';


const RoutableComponent = <template>
    <InspectorSupport >
        {{outlet}}
    </InspectorSupport>
</template>;


export default class ApplicationRoute extends RoutableComponentRoute(RoutableComponent) {
    activate() {
        console.log('activate');
    }
}
