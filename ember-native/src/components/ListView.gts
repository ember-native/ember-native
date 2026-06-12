import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import type {
  ListView as NativeListView,
  StackLayout,
  ItemEventData,
  EventData,
} from '@nativescript/core';
import { Color } from '@nativescript/core';
import { tracked } from '@glimmer/tracking';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
import DocumentNode from '../dom/nodes/DocumentNode.ts';

interface ListViewInterface<T> {
  Element: NativeElementNode<NativeListView>;
  Args: {
    items: T[];
    key?: string;
    
    // Event handlers
    onItemTap?: (args: ItemEventData) => void;
    onItemLoading?: (args: ItemEventData) => void;
    onLoadMoreItems?: (args: EventData) => void;
    onSearchChange?: (args: EventData) => void;
    
    // Properties
    sectioned?: boolean;
    stickyHeader?: boolean;
    stickyHeaderHeight?: number;
    stickyHeaderTopPadding?: boolean | number;
    showSearch?: boolean;
    searchAutoHide?: boolean;
    separatorColor?: string;
    rowHeight?: number;
    iosEstimatedRowHeight?: number;
  };
  Blocks: {
    item: [T | null];
    publicApi: [{
      refresh: () => void;
      scrollToIndex: (index: number) => void;
      scrollToIndexAnimated: (index: number) => void;
      isItemAtIndexVisible: (index: number) => boolean;
    }];
  };
}

type Ref<T> = {
  index: number;
  item: T | null;
  element: NativeElementNode<any>;
};

export default class ListView<T> extends Component<ListViewInterface<T>> {
  @tracked elementRefs: Ref<T>[] = [];
  private listViewElement?: NativeElementNode<NativeListView>;

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
        ((listView.nativeView as any)._realizedItems).delete(
          elementRef.element.nativeView,
        );
      }
    }
    this.elementRefs = this.elementRefs.filter(
      (e) => !!e.element.nativeView.nativeViewProtected?.getWindowToken(),
    );
  }

  // Public methods
  refresh() {
    if (this.listViewElement) {
      this.listViewElement.nativeView.refresh();
    }
  }

  scrollToIndex(index: number) {
    if (this.listViewElement) {
      this.listViewElement.nativeView.scrollToIndex(index);
    }
  }

  scrollToIndexAnimated(index: number) {
    if (this.listViewElement) {
      this.listViewElement.nativeView.scrollToIndexAnimated(index);
    }
  }

  isItemAtIndexVisible(index: number): boolean {
    if (this.listViewElement) {
      return this.listViewElement.nativeView.isItemAtIndexVisible(index);
    }
    return false;
  }

  get publicApi() {
    return {
      refresh: this.refresh.bind(this),
      scrollToIndex: this.scrollToIndex.bind(this),
      scrollToIndexAnimated: this.scrollToIndexAnimated.bind(this),
      isItemAtIndexVisible: this.isItemAtIndexVisible.bind(this),
    };
  }

  setupListView = modifier(
    function setupListView(
      this: ListView<T>,
      listView: NativeElementNode<NativeListView>,
    ) {
      const listViewComponent = this;
      this.listViewElement = listView;
      
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
      
      // Event handlers
      if (listViewComponent.args.onItemTap) {
        listView.nativeView.on('itemTap', (args: ItemEventData) => {
          listViewComponent.args.onItemTap!(args);
        });
      }
      
      if (listViewComponent.args.onItemLoading) {
        listView.nativeView.on('itemLoading', (args: ItemEventData) => {
          listViewComponent.args.onItemLoading!(args);
        });
      }
      
      if (listViewComponent.args.onLoadMoreItems) {
        listView.nativeView.on('loadMoreItems', (args: EventData) => {
          listViewComponent.args.onLoadMoreItems!(args);
        });
      }
      
      if (listViewComponent.args.onSearchChange) {
        listView.nativeView.on('searchChange', (args: EventData) => {
          listViewComponent.args.onSearchChange!(args);
        });
      }
      
      // Properties
      if (listViewComponent.args.sectioned !== undefined) {
        (listView.nativeView as any).sectioned = listViewComponent.args.sectioned;
      }
      
      if (listViewComponent.args.stickyHeader !== undefined) {
        (listView.nativeView as any).stickyHeader = listViewComponent.args.stickyHeader;
      }
      
      if (listViewComponent.args.stickyHeaderHeight !== undefined) {
        (listView.nativeView as any).stickyHeaderHeight = listViewComponent.args.stickyHeaderHeight;
      }
      
      if (listViewComponent.args.stickyHeaderTopPadding !== undefined) {
        (listView.nativeView as any).stickyHeaderTopPadding = listViewComponent.args.stickyHeaderTopPadding;
      }
      
      if (listViewComponent.args.showSearch !== undefined) {
        (listView.nativeView as any).showSearch = listViewComponent.args.showSearch;
      }
      
      if (listViewComponent.args.searchAutoHide !== undefined) {
        (listView.nativeView as any).searchAutoHide = listViewComponent.args.searchAutoHide;
      }
      
      if (listViewComponent.args.separatorColor !== undefined) {
        listView.nativeView.separatorColor = new Color(listViewComponent.args.separatorColor);
      }
      
      if (listViewComponent.args.rowHeight !== undefined) {
        listView.nativeView.rowHeight = listViewComponent.args.rowHeight;
      }
      
      if (listViewComponent.args.iosEstimatedRowHeight !== undefined) {
        listView.nativeView.iosEstimatedRowHeight = listViewComponent.args.iosEstimatedRowHeight;
      }
    }.bind(this),
  );

  <template>
    <list-view {{this.setupListView}} items={{@items}} ...attributes />
    {{yield this.publicApi to='publicApi'}}
    {{#each this.items key=this.itemKey as |item|}}
      {{#in-element item.element}}
        {{yield item.item to='item'}}
      {{/in-element}}
    {{/each}}
  </template>
}