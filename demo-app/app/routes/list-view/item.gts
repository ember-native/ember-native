import RoutableComponentRoute from 'ember-routable-component';
import type HistoryService from 'ember-native/services/history';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Component from '@glimmer/component';

interface PageSignature {
    Args: {
        model: { index: string };
    };
}

export class Page extends Component<PageSignature> {
    @service('ember-native/history') history!: HistoryService;
    <template>
        <page id='item-page'>
            <action-bar title="Item {{@model.index}}">
                <navigation-button
                    {{on 'tap' this.history.back}}
                    android.position="left"
                    text="Go back"
                    android.systemIcon="ic_menu_back"
                />
            </action-bar>
            <stack-layout>
                <label text="Selected: {{@model.index}}" />
            </stack-layout>
        </page>
    </template>
}

// Navigating here pushes this page onto the real `Frame` backstack
// (`FrameElement` in `ember-native/src/dom/native/FrameElement.ts`);
// going back pops it. The parent `list-view` route's own page (wrapped in
// `FrameOutlet` - see `demo-app/app/routes/list-view.gts`) is never torn
// down while this route is active, so returning to it shows the list
// instantly instead of re-rendering it.
export default class ListViewItemRoute extends RoutableComponentRoute(Page) {
    model(params: { index: string }) {
        return { index: params.index };
    }

    serialize(model: { index: string }) {
        return { index: model.index };
    }
}
