import Component from "@glimmer/component";
import { modifier } from 'ember-modifier';
import { tracked } from "@glimmer/tracking";
import ElementNode from "../dom/nodes/ElementNode";
import { RadListView as NativeRadListView } from "nativescript-ui-listview";

class TrackedMap extends Map<any, any> {
  @tracked counter = 0;
  set(key:any, value:any):this {
    this.counter += 1;
    super.set(key, value);
    return this;
  }

  get(key:any):any {
    if (this.counter === 0) return null;
    return super.get(key);
  }

  entries():IterableIterator<[any, any]> {
    if (this.counter === 0) return [];
    return super.entries();
  }
}


interface RadListViewInterface<T> {
  Element: NativeRadListView;
  Args: {
    items: T[];
  };
  Blocks: {
    header: [];
    footer: [];
    item: [T];
  }
}


export default class RadListView<T> extends Component<RadListViewInterface<T>> {
  elementRefs = new TrackedMap();
  @tracked private listView: NativeRadListView<T>;
  private headerElement: ElementNode;
  private footerElement: ElementNode;

  get items() {
    return [...this.elementRefs.entries()].map(([element, item]) => {
      return {
        item,
        element
      }
    });
  }

  setupListView = modifier(function setupListView(listView: RadListView) {
    this.listView = listView;
    const listViewComponent = this;
    function _getDefaultItemContent() {
      const sl = document.createElement('stackLayout') as ElementNode;
      Object.defineProperty(sl.nativeView, 'parent', {
        get() {
          return this._parent;
        },
        set(v:any) {
          this._parent = v;
          Object.defineProperty(v, 'bindingContext', {
            get() {
              listViewComponent.elementRefs.get(sl);
            },
            set(v:any) {
              listViewComponent.elementRefs.set(sl, v);
            }
          });
        }
      });
      return sl.nativeView;
    }
    listView.nativeView.itemTemplate = _getDefaultItemContent;
    listView.nativeView._prepareItem = (stackLayout, index) => {
      const ref = listViewComponent.elementRefs.find(e => e.element.nativeView === stackLayout);
      ref.index = index;
      listViewComponent.elementRefs = [...listViewComponent.elementRefs];
    };
  }.bind(this))

  setupHeader = () => {
    this.headerElement = document.createElement('stackLayout');
    this.listView.nativeView.headerItemTemplate = () => this.headerElement.nativeView;
  };

  setupFooter = () => {
    this.footerElement = document.createElement('stackLayout');
    this.listView.nativeView.footerItemTemplate = () => this.footerElement.nativeView;
  };

  <template>
    <rad-list-view {{this.setupListView}} items={{@items}} ...attributes />
    {{#if this.listView}}
      {{#if (has-block 'header')}}
        {{this.setupHeader}}
        {{#in-element this.headerElement}}
          {{yield to='header'}}
        {{/in-element}}
      {{/if}}
      {{#each this.items as |item|}}
        {{#in-element item.element}}
          {{yield item.item to='item'}}
        {{/in-element}}
      {{/each}}
      {{#if (has-block 'footer')}}
        {{this.setupFooter}}
        {{#in-element this.footerElement}}
          {{yield to='footer'}}
        {{/in-element}}
      {{/if}}
    {{/if}}
  </template>
}
