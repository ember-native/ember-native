import RoutableComponentRoute from 'ember-routable-component';
import type HistoryService from 'ember-native/services/history';
import { RadListView } from 'ember-native/components/index';
import { on } from "@ember/modifier";
import { service } from "@ember/service";
import Component from "@glimmer/component";
import {tracked} from "@glimmer/tracking";

class Page extends Component {
    @service('ember-native/history') history!: HistoryService;
    @tracked list = ['a', 'b', 'c'];
    start = () => {
        const lists = [
            ['a', 'b', 'c'],
            ['a', 'b', 'c', 'd', 'e'],
            ['1', '2', '3'],
            ['1', '2', '3', '4', '5'],
        ];
        setInterval(() => {
            this.list = lists[Math.floor(Math.random() * lists.length)];
        }, 200);
    }
    <template>
        <page>
            <action-bar title="Rad List View">
                <navigation-button
                    {{on 'tap' this.history.back}}
                    visibility="{{if this.history.stack.length 'visible' 'collapse'}}"
                    android.position="left"
                    text="Go back"
                    android.systemIcon="ic_menu_back"
                />
            </action-bar>
            <stack-layout>
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
            </stack-layout>
        </page>
    </template>
}

// this will generate a Route class and use the provided template
export default class RadListViewRoute extends RoutableComponentRoute(Page) {
    activate() {
        console.log('activate');
    }
}
