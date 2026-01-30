
import { a as _applyDecoratedDescriptor, _ as _defineProperty, b as _initializerDefineProperty } from '../_rollupPluginBabelHelpers-ClPBvGFm.js';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { tracked } from '@glimmer/tracking';
import { ListViewViewType } from 'nativescript-ui-listview';
import DocumentNode from '../dom/nodes/DocumentNode.js';
import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@ember/component';

var _class, _descriptor, _class2, _descriptor2, _RadListView;
let TrackedMap = (_class = class TrackedMap extends Map {
  constructor(...args) {
    super(...args);
    _initializerDefineProperty(this, "counter", _descriptor, this);
  }
  set(key, value) {
    this.counter += 1;
    super.set(key, value);
    return this;
  }
  get(key) {
    if (this.counter === 0) return null;
    return super.get(key);
  }
  entries() {
    if (this.counter === 0) return super.entries();
    return super.entries();
  }
}, _descriptor = _applyDecoratedDescriptor(_class.prototype, "counter", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _class);
let RadListView = (_class2 = (_RadListView = class RadListView extends Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "elementRefs", new TrackedMap());
    _initializerDefineProperty(this, "listView", _descriptor2, this);
    _defineProperty(this, "setupListView", modifier(function setupListView(listView) {
      this.listView = listView;
      listView.nativeView.on('itemRecyclingInternal', () => {
        this.cleanup(listView);
      });
      const listViewComponent = this;
      function _getDefaultItemContent() {
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
    for (const [element] of [...this.elementRefs.entries()]) {
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
    if (this.args.key) {
      return 'item.' + this.args.key;
    }
    return 'item';
  }
  get items() {
    return [...this.elementRefs.entries()].map(([element, item]) => {
      return {
        item,
        element
      };
    });
  }
}, setComponentTemplate(precompileTemplate("\n    <rad-list-view {{this.setupListView}} items={{@items}} ...attributes />\n    {{#if this.listView}}\n      {{#if (has-block \"header\")}}\n        {{this.setupHeader}}\n        {{#in-element this.headerElement}}\n          {{yield to=\"header\"}}\n        {{/in-element}}\n      {{/if}}\n      {{#each this.items key=this.itemKey as |item|}}\n        {{#in-element item.element}}\n          {{yield item.item to=\"item\"}}\n        {{/in-element}}\n      {{/each}}\n      {{#if (has-block \"footer\")}}\n        {{this.setupFooter}}\n        {{#in-element this.footerElement}}\n          {{yield to=\"footer\"}}\n        {{/in-element}}\n      {{/if}}\n    {{/if}}\n  ", {
  strictMode: true
}), _RadListView), _RadListView), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "listView", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _class2);

export { RadListView as default };
//# sourceMappingURL=RadListView.js.map
