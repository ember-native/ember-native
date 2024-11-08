import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import type {
  ListView as NativeListView,
  StackLayout,
} from '@nativescript/core';
import { tracked } from '@glimmer/tracking';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
import DocumentNode from '../dom/nodes/DocumentNode.ts';

interface ListViewInterface<T> {
  Element: NativeElementNode<NativeListView>;
  Args: {
    items: T[];
  };
  Blocks: {
    item: [T];
  };
}

export default class ListView<T> extends Component<ListViewInterface<T>> {
  @tracked elementRefs: {
    index: number;
    item: T | null;
    element: NativeElementNode<any>;
  }[] = [];

  get items() {
    return this.elementRefs.map(({ element, index }) => {
      return {
        index,
        item: this.args.items[index] || '',
        element,
      };
    });
  }

  cleanup(listView: NativeElementNode<NativeListView>) {
    for (const elementRef of this.elementRefs) {
      const n = elementRef.element.nativeView.nativeViewProtected;
      if (!n || !n.getWindowToken()) {
        elementRef.element.parentNode!.removeChild(elementRef.element);
        ((listView.nativeView as any)._realizedItems as any).delete(
          elementRef.element.nativeView,
        );
      }
    }
    this.elementRefs = this.elementRefs.filter(
      (e) => !!e.element.nativeView.nativeViewProtected?.getWindowToken(),
    );
  }

  setupListView = modifier(
    function setupListView(
      this: ListView<T>,
      listView: NativeElementNode<NativeListView>,
    ) {
      const listViewComponent = this;
      function _getDefaultItemContent(index: number) {
        listViewComponent.cleanup(listView);
        const sl = DocumentNode.createElement('stack-layout');
        listViewComponent.elementRefs.push({
          element: sl,
          item: null,
          index,
        });
        listViewComponent.elementRefs = [...listViewComponent.elementRefs];
        return sl.nativeView;
      }
      (listView.nativeView as any)._getDefaultItemContent =
        _getDefaultItemContent;
      (listView.nativeView as any)._prepareItem = (
        stackLayout: StackLayout,
        index: number,
      ) => {
        const ref = listViewComponent.elementRefs.find(
          (e) => e.element.nativeView === stackLayout,
        )!;
        ref.index = index;
        listViewComponent.elementRefs = [...listViewComponent.elementRefs];
      };
    }.bind(this),
  );

  <template>
    <list-view {{this.setupListView}} items={{@items}} ...attributes />
    {{#each this.items as |item|}}
      {{#in-element item.element}}
        {{yield item.item to='item'}}
      {{/in-element}}
    {{/each}}
  </template>
}
