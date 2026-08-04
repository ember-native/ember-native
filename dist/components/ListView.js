import { _ as _defineProperty, a as _applyDecoratedDescriptor, b as _initializerDefineProperty } from '../_rollupPluginBabelHelpers-apNPIsxw.js';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { Color } from '@nativescript/core';
import { tracked } from '@glimmer/tracking';
import DocumentNode from '../dom/nodes/DocumentNode.js';
import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@ember/component';

var _class, _descriptor, _ListView;
let ListView = (_class = (_ListView = class ListView extends Component {
  constructor(..._args) {
    super(..._args);
    _initializerDefineProperty(this, "elementRefs", _descriptor, this);
    _defineProperty(this, "listViewElement", void 0);
    _defineProperty(this, "setupListView", modifier(function setupListView(listView) {
      const listViewComponent = this;
      this.listViewElement = listView;
      function _getDefaultItemContent(index) {
        listViewComponent.cleanup(listView);
        const sl = DocumentNode.createElement('stack-layout');
        listView.appendChild(sl);
        listViewComponent.elementRefs.push({
          element: sl,
          item: null,
          index
        });
        listViewComponent.elementRefs = [...listViewComponent.elementRefs];
        return sl.nativeView;
      }
      listView.nativeView._getDefaultItemContent = _getDefaultItemContent;
      listView.nativeView._prepareItem = (stackLayout, index) => {
        const ref = listViewComponent.elementRefs.find(e => e.element.nativeView === stackLayout);
        if (ref.index === index) {
          return;
        }
        ref.index = index;
        listViewComponent.elementRefs = [...listViewComponent.elementRefs];
      };
      // Event handlers
      if (listViewComponent.args.onItemTap) {
        listView.nativeView.on('itemTap', args => {
          listViewComponent.args.onItemTap(args);
        });
      }
      if (listViewComponent.args.onItemLoading) {
        listView.nativeView.on('itemLoading', args => {
          listViewComponent.args.onItemLoading(args);
        });
      }
      if (listViewComponent.args.onLoadMoreItems) {
        listView.nativeView.on('loadMoreItems', args => {
          listViewComponent.args.onLoadMoreItems(args);
        });
      }
      if (listViewComponent.args.onSearchChange) {
        listView.nativeView.on('searchChange', args => {
          listViewComponent.args.onSearchChange(args);
        });
      }
      // Properties
      if (listViewComponent.args.sectioned !== undefined) {
        listView.nativeView.sectioned = listViewComponent.args.sectioned;
      }
      if (listViewComponent.args.stickyHeader !== undefined) {
        listView.nativeView.stickyHeader = listViewComponent.args.stickyHeader;
      }
      if (listViewComponent.args.stickyHeaderHeight !== undefined) {
        listView.nativeView.stickyHeaderHeight = listViewComponent.args.stickyHeaderHeight;
      }
      if (listViewComponent.args.stickyHeaderTopPadding !== undefined) {
        listView.nativeView.stickyHeaderTopPadding = listViewComponent.args.stickyHeaderTopPadding;
      }
      if (listViewComponent.args.showSearch !== undefined) {
        listView.nativeView.showSearch = listViewComponent.args.showSearch;
      }
      if (listViewComponent.args.searchAutoHide !== undefined) {
        listView.nativeView.searchAutoHide = listViewComponent.args.searchAutoHide;
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
    }.bind(this)));
  }
  get items() {
    return this.elementRefs.filter(x => x.index < this.args.items.length).map(({
      element,
      index
    }) => {
      return {
        index,
        item: this.args.items[index] || null,
        element
      };
    });
  }
  get itemKey() {
    if (this.args.key) {
      return 'item.' + this.args.key;
    }
    return 'item';
  }
  cleanup(listView) {
    for (const elementRef of this.elementRefs) {
      const n = elementRef.element.nativeView.nativeViewProtected;
      if (!n || !n.getWindowToken()) {
        elementRef.element.parentNode?.removeChild(elementRef.element);
        listView.nativeView._realizedItems.delete(elementRef.element.nativeView);
      }
    }
    this.elementRefs = this.elementRefs.filter(e => !!e.element.nativeView.nativeViewProtected?.getWindowToken());
  }
  // Public methods
  refresh() {
    if (this.listViewElement) {
      this.listViewElement.nativeView.refresh();
    }
  }
  scrollToIndex(index) {
    if (this.listViewElement) {
      this.listViewElement.nativeView.scrollToIndex(index);
    }
  }
  scrollToIndexAnimated(index) {
    if (this.listViewElement) {
      this.listViewElement.nativeView.scrollToIndexAnimated(index);
    }
  }
  isItemAtIndexVisible(index) {
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
      isItemAtIndexVisible: this.isItemAtIndexVisible.bind(this)
    };
  }
}, setComponentTemplate(precompileTemplate("<list-view {{this.setupListView}} items={{@items}} ...attributes />\n{{yield this.publicApi to=\"publicApi\"}}\n{{#each this.items key=this.itemKey as |item|}}\n  {{#in-element item.element}}\n    {{yield item.item to=\"item\"}}\n  {{/in-element}}\n{{/each}}", {
  strictMode: true
}), _ListView), _ListView), _descriptor = _applyDecoratedDescriptor(_class.prototype, "elementRefs", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return [];
  }
}), _class);

export { ListView as default };
//# sourceMappingURL=ListView.js.map
