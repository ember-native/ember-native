
import { _ as _defineProperty, a as _applyDecoratedDescriptor, b as _initializerDefineProperty } from '../_rollupPluginBabelHelpers-ClPBvGFm.js';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { tracked } from '@glimmer/tracking';
import DocumentNode from '../dom/nodes/DocumentNode.js';
import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@ember/component';

var _class, _descriptor, _ListView;
let ListView = (_class = (_ListView = class ListView extends Component {
  constructor(...args) {
    super(...args);
    _initializerDefineProperty(this, "elementRefs", _descriptor, this);
    _defineProperty(this, "setupListView", modifier(function setupListView(listView) {
      const listViewComponent = this;
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
}, setComponentTemplate(precompileTemplate("\n    <list-view {{this.setupListView}} items={{@items}} ...attributes />\n    {{#each this.items key=this.itemKey as |item|}}\n      {{#in-element item.element}}\n        {{yield item.item to=\"item\"}}\n      {{/in-element}}\n    {{/each}}\n  ", {
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
