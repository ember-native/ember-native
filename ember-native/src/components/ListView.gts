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
    key?: string;
  };
  Blocks: {
    item: [T | null];
  };
}

type Ref<T> = {
  index: number;
  item: T | null;
  element: NativeElementNode<any>;
};

export default class ListView<T> extends Component<ListViewInterface<T>> {
  @tracked elementRefs: Ref<T>[] = [];

  get items(): Ref<T>[] {
    return this.elementRefs
      .filter((x) => x.index < this.args.items.length)
      .map(({ element, index }) => {
        return {
          index,
          item: this.args.items[index] || null,
          element,
        };
      });
  }

  get itemKey() {
    if (this.args.key) {
      return 'item.' + this.args.key;
    }
    return 'item';
  }

  cleanup(listView: NativeElementNode<NativeListView>) {
    for (const elementRef of this.elementRefs) {
      const n = elementRef.element.nativeView.nativeViewProtected;
      if (!n || !n.getWindowToken()) {
        elementRef.element.parentNode?.removeChild(elementRef.element);
        ((listView.nativeView as any)._realizedItems as any).delete(
          elementRef.element.nativeView,
        );
      }
    }
    this.elementRefs = this.elementRefs.filter(
      (e) => !!e.element.nativeView.nativeViewProtected?.getWindowToken(),
    ) as Ref<T>[];
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
        listView.appendChild(sl);
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
        if (ref.index === index) {
          return;
        }
        ref.index = index;
        listViewComponent.elementRefs = [...listViewComponent.elementRefs];
      };
    }.bind(this),
  );

  <template>
    <list-view {{this.setupListView}} items={{@items}} ...attributes />
    {{#each this.items key=this.itemKey as |item|}}
      {{#in-element item.element}}
        {{yield item.item to='item'}}
      {{/in-element}}
    {{/each}}
  </template>
}
