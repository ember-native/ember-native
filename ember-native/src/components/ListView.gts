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
import TrackedMap from './tracked-map.ts';
import { glimmerTrackedMapHooks } from './tracked-map-glimmer.ts';

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

export default class ListView<T> extends Component<ListViewInterface<T>> {
  // Maps each realized row's stack-layout element to the item index it is
  // currently bound to. Each index is stored in its own tracked cell, so a
  // single row recycling during scroll only invalidates that one row's
  // `{{#in-element}}` block instead of forcing every visible row to
  // re-render (the previous whole-array reassignment did the latter, which
  // is what caused the fast-scroll lag).
  private elementRefs: TrackedMap<NativeElementNode<StackLayout>, number> =
    new TrackedMap(glimmerTrackedMapHooks());
  // Plain (untracked) native-view -> element index for O(1) lookup on the hot
  // recycle path; kept in sync with `elementRefs`.
  private elementsByNativeView = new Map<
    StackLayout,
    NativeElementNode<StackLayout>
  >();
  @tracked private listViewElement?: NativeElementNode<NativeListView>;

  get items() {
    const elementRefs = this.elementRefs;
    const args = this.args;
    // Read ONLY the set of keys (the realized row elements) here, never any
    // per-row value. A recycle rebinds a single row's index via
    // `elementRefs.set`, which bumps only that row's value cell - so it must
    // not be read in this getter, or every recycle would re-run the whole
    // `keys().map()` and re-diff the `{{#each}}` (that array rebuild per
    // scroll frame is the cost we're avoiding). The per-row `inRange`/`item`
    // getters below each read only their own row's cell, so a recycle
    // invalidates just that one row's `{{#in-element}}` block.
    return elementRefs.keys().map((element) => {
      return {
        element,
        // True when this row's bound index is valid for the current items.
        // After the list shrinks, a recycled row still exists as a key but
        // may point past the end; the template guards on this so such a row
        // renders nothing rather than yielding a `null` item into `:item`.
        get inRange(): boolean {
          const index = elementRefs.get(element);
          return index !== undefined && index < args.items.length;
        },
        get item(): T | null {
          const index = elementRefs.get(element);
          if (index === undefined) {
            return null;
          }
          return args.items[index] ?? null;
        },
      };
    });
  }

  get itemKey() {
    // Rows are keyed by the stable stack-layout element rather than the
    // item value, so recycling a row (rebinding it to a new index) reuses
    // the same `{{#in-element}}` destination instead of tearing it down.
    return 'element';
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

  cleanup(listView: NativeElementNode<NativeListView>) {
    for (const element of this.elementRefs.keys()) {
      const n = element.nativeView.nativeViewProtected;
      if (!n || !n.getWindowToken()) {
        element.parentNode?.removeChild(element);
        ((listView.nativeView as any)._realizedItems).delete(
          element.nativeView,
        );
        this.elementRefs.delete(element);
        this.elementsByNativeView.delete(element.nativeView);
      }
    }
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
        const sl = DocumentNode.createElement('stack-layout') as NativeElementNode<StackLayout>;
        listView.appendChild(sl);
        listViewComponent.elementRefs.set(sl, index);
        listViewComponent.elementsByNativeView.set(sl.nativeView, sl);
        return sl.nativeView;
      }
      (listView.nativeView as any)._getDefaultItemContent =
        _getDefaultItemContent;
      (listView.nativeView as any)._prepareItem = (
        stackLayout: StackLayout,
        index: number,
      ) => {
        const element = listViewComponent.elementsByNativeView.get(stackLayout);
        if (!element) {
          return;
        }
        if (listViewComponent.elementRefs.get(element) === index) {
          return;
        }
        // Rebind just this row; only this row's tracked cell bumps.
        listViewComponent.elementRefs.set(element, index);
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
        {{#if item.inRange}}
          {{yield item.item to='item'}}
        {{/if}}
      {{/in-element}}
    {{/each}}
  </template>
}