import RoutableComponentRoute from 'ember-routable-component';
import type HistoryService from 'ember-native/services/history';
import { ListView, PageStackOutlet } from 'ember-native/components/index';
import { on } from "@ember/modifier";
import { hash } from "@ember/helper";
import { service } from "@ember/service";
import Component from "@glimmer/component";
import {tracked} from "@glimmer/tracking";
import LinkTo from '../ui/components/link-to';
import { incrementPageConstructCount } from '../lib/list-view-render-count';

export class Page extends Component {
    @service('ember-native/history') history!: HistoryService;
    @tracked list = ['a', 'b', 'c'];

    constructor(...args: ConstructorParameters<typeof Component>) {
        super(...args);
        incrementPageConstructCount();
    }

    start = () => {
        const lists = [
            ['a', 'b', 'c'],
            ['a', 'b', 'c', 'd', 'e'],
            ['1', '2', '3'],
            ['1', '2', '3', '4', '5']
        ];
        setInterval(() => {
            this.list = lists[Math.floor(Math.random() * lists.length)];
        }, 200);
    }
    <template>
        <PageStackOutlet @routeName='list-view'>
            <page id='list-view-page'>
                <action-bar title="List View">
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
                    <ListView @items={{this.list}}>
                        <:item as |item|>
                            <LinkTo @route='list-view.item' @model={{hash index=item}}>
                                <label>
                                    {{item}}
                                </label>
                            </LinkTo>
                        </:item>
                    </ListView>
                </stack-layout>
            </page>
        </PageStackOutlet>
    </template>
}

// this will generate a Route class and use the provided template
export default class ListViewRoute extends RoutableComponentRoute(Page) {
    activate() {
        console.log('activate');
    }
}
