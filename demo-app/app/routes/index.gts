import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';
import {on} from "@ember/modifier";
import {service} from "@ember/service";
import {tracked} from "@glimmer/tracking";
import Component from "@glimmer/component";
import ListView from 'ember-native/components/ListView';
import RadListView from 'ember-native/components/RadListView';



class Page extends Component {
    @service history;
    @tracked list = ['a', 'b', 'c'];
    start = () => {
        console.log('start');
        const lists = [
            ['a', 'b', 'c'],
            ['a', 'b', 'c', 'd', 'e'],
            ['1', '2', '3'],
            ['1', '2', '3', 4, 5],
        ];
        setInterval(() => {
            this.list = lists[Math.floor(Math.random() * lists.length)];
        }, 200);
    }
    <template>
        <page>
            <actionBar title="MyApp">
                <navigationButton
                    {{on 'tap' this.history.back}}
                    visibility="{{unless this.history.stack.length 'collapse'}}"
                    android.position="left"
                    text="Go back"
                    android.systemIcon="ic_menu_back"
                />
            </actionBar>
            <stackLayout>
                <label text='Hello world 2!'></label>
                <LinkTo @route='test' @text="test" />
                {{(this.start)}}
                <RadListView @items={{this.list}}>
                    <:header><label>header</label></:header>
                    <:item as |item|>
                        <label>
                            {{item}}
                        </label>
                    </:item>
                    <:footer><label>footer</label></:footer>
                </RadListView>
            </stackLayout>
        </page>
    </template>
}

// this will generate a Route class and use the provided template
export default class IndexRoute extends RoutableComponentRoute(Page) {
    activate() {
        console.log('activate');
    }
}
