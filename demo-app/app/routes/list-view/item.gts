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

// Navigating here and back is handled by `PageStackOutlet` in the parent
// `list-view` route (see `demo-app/app/routes/list-view.gts`) - going back
// shows the list instantly, without re-rendering it, because it was never
// torn down while this route was active.
export default class ListViewItemRoute extends RoutableComponentRoute(Page) {
    model(params: { index: string }) {
        return { index: params.index };
    }

    serialize(model: { index: string }) {
        return { index: model.index };
    }
}
