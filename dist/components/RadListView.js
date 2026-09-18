import { _ as _defineProperty, b as _initializerDefineProperty, a as _applyDecoratedDescriptor } from '../_rollupPluginBabelHelpers-apNPIsxw.js';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { tracked } from '@glimmer/tracking';
import { ListViewViewType } from 'nativescript-ui-listview';
import DocumentNode from '../dom/nodes/DocumentNode.js';
import TrackedMap from './tracked-map.js';
import { glimmerTrackedMapHooks } from './tracked-map-glimmer.js';
import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@ember/component';

var _class, _descriptor, _RadListView;
let RadListView = (_class = (_RadListView = class RadListView extends Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "elementRefs", new TrackedMap(glimmerTrackedMapHooks()));
    _initializerDefineProperty(this, "listView", _descriptor, this);
    _defineProperty(this, "setupListView", modifier(function setupListView(listView) {
      this.listView = listView;
      const listViewComponent = this;
      // Prune window-detached rows when the native list recycles cells. The
      // `cleanup` guard makes this a cheap no-op during steady-state scroll
      // (realized rows never exceed `@items.length`) and only performs the
      // O(n) sweep + structure bump when the list actually shrank and left
      // rows orphaned - e.g. `@items` going from 2 entries to 1. Without this,
      // a shrink recycles a row without realizing a new element, so the stale
      // row's content would linger in the tree.
      listView.nativeView.on('itemRecyclingInternal', () => {
        listViewComponent.cleanup(listView);
      });
      function _getDefaultItemContent() {
        // Also prune on element realize (matching ListView's
        // `_getDefaultItemContent`) so a brand-new row triggers a sweep too.
        listViewComponent.cleanup(listView);
        const sl = DocumentNode.createElement('stack-layout');
        listView.appendChild(sl);
        Object.defineProperty(sl.nativeView, 'parent', {
          get() {
            return this._parent;
          },
          set(v) {
            this._parent = v;
            Object.defineProperty(v, 'bindingContext', {
              get() {
                return listViewComponent.elementRefs.get(sl);
              },
              set(v) {
                listViewComponent.elementRefs.set(sl, v);
              }
            });
          }
        });
        return sl.nativeView;
      }
      listView.nativeView.itemViewLoader = type => {
        switch (type) {
          case ListViewViewType.ItemView:
            return _getDefaultItemContent();
          case ListViewViewType.HeaderView:
            return this.headerElement.nativeView;
          case ListViewViewType.FooterView:
            return this.footerElement.nativeView;
        }
        return DocumentNode.createElement('stack-layout').nativeView;
      };
    }.bind(this)));
    _defineProperty(this, "setupHeader", () => {
      this.headerElement = DocumentNode.createElement('stack-layout');
    });
    _defineProperty(this, "setupFooter", () => {
      this.footerElement = DocumentNode.createElement('stack-layout');
    });
  }
  cleanup(listView) {
    // Only sweep when there are more realized rows than items being displayed,
    // i.e. the list actually shrank and left rows orphaned/window-detached.
    // During steady-state scroll the realized-row count tracks the visible
    // window and never exceeds `@items.length`, so this guard keeps the O(n)
    // sweep - and the `elementRefs.delete` that dirties the TrackedMap's
    // `structure` signal and re-diffs the whole `{{#each}}` - off the hot
    // recycle path that caused fast-scroll lag.
    if (this.elementRefs.size <= (this.args.items?.length ?? 0)) {
      return;
    }
    for (const element of this.elementRefs.keys()) {
      const n = element.nativeView.nativeViewProtected;
      if (!n || !n.getWindowToken()) {
        this.elementRefs.delete(element);
        const idx = listView.childNodes.findIndex(c => c === element);
        if (idx >= 0) {
          listView.childNodes.splice(idx, 1);
        }
      }
    }
  }
  get itemKey() {
    // Key rows by the stable stack-layout element, not the item value.
    // The native RadListView recycles a row by rebinding its bindingContext
    // (-> `elementRefs.set(element, newItem)`), which changes the row's
    // `item`. Keying by `item` would make Glimmer treat a recycled row as a
    // brand-new one and tear down/rebuild its `{{#in-element}}` block every
    // recycle (and risk duplicate keys when two rows transiently share a
    // value). Keying by the element keeps the block mounted and reused - the
    // per-row `item` getter drives the content update instead.
    return 'element';
  }
  get items() {
    const elementRefs = this.elementRefs;
    // Only the set of keys is read here, so updating a single row's
    // bindingContext (via elementRefs.set) doesn't invalidate this getter
    // for the other rows; `item` is read per-row in the template instead.
    return elementRefs.keys().map(element => {
      return {
        element,
        get item() {
          return elementRefs.get(element);
        }
      };
    });
  }
}, setComponentTemplate(precompileTemplate("<rad-list-view {{this.setupListView}} items={{@items}} ...attributes />\n{{#if this.listView}}\n  {{#if (has-block \"header\")}}\n    {{this.setupHeader}}\n    {{#in-element this.headerElement}}\n      {{yield to=\"header\"}}\n    {{/in-element}}\n  {{/if}}\n  {{#each this.items key=this.itemKey as |item|}}\n    {{#in-element item.element}}\n      {{yield item.item to=\"item\"}}\n    {{/in-element}}\n  {{/each}}\n  {{#if (has-block \"footer\")}}\n    {{this.setupFooter}}\n    {{#in-element this.footerElement}}\n      {{yield to=\"footer\"}}\n    {{/in-element}}\n  {{/if}}\n{{/if}}", {
  strictMode: true
}), _RadListView), _RadListView), _descriptor = _applyDecoratedDescriptor(_class.prototype, "listView", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _class);

export { RadListView as default };
//# sourceMappingURL=RadListView.js.map
