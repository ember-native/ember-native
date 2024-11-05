import Component from "@glimmer/component";
import { modifier } from 'ember-modifier';
import type { ListView as NativeListView } from '@nativescript/core';
import { tracked } from "@glimmer/tracking";


interface ListViewInterface<T> {
  Element: NativeListView;
  Args: {
    items: T[];
  };
  Blocks: {
    item: [T];
  }
}


export default class ListViewInterface<T> extends Component<ListViewInterface<T>> {
    @tracked elementRefs = [];

    get items() {
        return this.elementRefs.map(({element, index}) => {
            return {
                index,
                item: this.args.items[index] || '',
                element
            }
        });
    }

    cleanup(listView) {
        for (const elementRef of this.elementRefs) {
            const n = elementRef.element.nativeView.nativeViewProtected;
            if (!n || !n.getWindowToken()) {
                elementRef.element.parentNode.removeChild(elementRef.element);
                listView.nativeView._realizedItems.delete(elementRef.element.nativeView);
            }
        }
        this.elementRefs = this.elementRefs.filter(e => !!e.element.nativeView.nativeViewProtected?.getWindowToken());
    }

    setupListView = modifier(function setupListView(listView: ListView) {
        const listViewComponent = this;
        function _getDefaultItemContent(index) {
            listViewComponent.cleanup(listView);
            const sl = document.createElement('stackLayout');
            listViewComponent.elementRefs.push({
                element: sl,
                index
            })
            listViewComponent.elementRefs = [...listViewComponent.elementRefs];
            return sl.nativeView;
        }
        listView.nativeView._getDefaultItemContent = _getDefaultItemContent;
        listView.nativeView._prepareItem = (stackLayout, index) => {
            const ref = listViewComponent.elementRefs.find(e => e.element.nativeView === stackLayout);
            ref.index = index;
            listViewComponent.elementRefs = [...listViewComponent.elementRefs];
        };
    }.bind(this))



    <template>
        <list-view {{this.setupListView}} items={{@items}} ...attributes/>
        {{#each this.items as |item|}}
            {{#in-element item.element}}
                {{yield item.item to='item'}}
            {{/in-element}}
        {{/each}}
    </template>
}
