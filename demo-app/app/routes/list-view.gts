import RoutableComponentRoute from 'ember-routable-component';
import type HistoryService from 'ember-native/services/history';
import { ListView, FrameOutlet } from 'ember-native/components/index';
import { on } from "@ember/modifier";
import { hash, fn } from "@ember/helper";
import { service } from "@ember/service";
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import LinkTo from '../ui/components/link-to';
import { incrementPageConstructCount } from '../lib/list-view-render-count';

export class Page extends Component {
    @service('ember-native/history') history!: HistoryService;
    list = ['a', 'b', 'c'];
    // Tracked on this route's own (long-lived) component instance rather
    // than the item route's, so tapping a row and going back to look at
    // another one keeps the previous row's selected state visible -
    // demonstrating that `FrameOutlet` never tears this page down while
    // `list-view.item` is active.
    @tracked selected: string | null = null;

    constructor(...args: ConstructorParameters<typeof Component>) {
        super(...args);
        incrementPageConstructCount();
    }

    get rows() {
        return this.list.map((value) => ({
            value,
            isSelected: value === this.selected,
        }));
    }

    select = (value: string) => {
        this.selected = value;
    };

    <template>
        <FrameOutlet>
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
                    <ListView height="100%" @items={{this.rows}}>
                        <:item as |row|>
                            <LinkTo
                                @route='list-view.item'
                                @model={{hash index=row.value}}
                                {{on 'tap' (fn this.select row.value)}}
                                backgroundColor="{{if row.isSelected '#aecbfa' '#e0e0e0'}}"
                            >
                                {{row.value}}
                            </LinkTo>
                        </:item>
                    </ListView>
                </stack-layout>
            </page>
        </FrameOutlet>
    </template>
}

// this will generate a Route class and use the provided template
export default class ListViewRoute extends RoutableComponentRoute(Page) {
    activate() {
        console.log('activate');
    }
}
