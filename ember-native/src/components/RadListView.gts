import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { tracked } from '@glimmer/tracking';
import {
  RadListView as NativeRadListView,
  ListViewViewType,
} from 'nativescript-ui-listview';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
import DocumentNode from '../dom/nodes/DocumentNode.ts';
import type { StackLayout } from '@nativescript/core';

class Ref<T> {
  @tracked value: T;
  constructor(value: T) {
    this.value = value;
  }
}

// A Map whose per-key values are individually tracked, so updating one
// entry only invalidates consumers of that entry rather than everything
// that reads the map (e.g. an `entries()`-derived list).
class TrackedMap<K, V> {
  @tracked private structure = 0;
  private map = new Map<K, Ref<V>>();

  set(key: K, value: V): this {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
    } else {
      this.map.set(key, new Ref(value));
      this.structure += 1;
    }
    return this;
  }

  get(key: K): V | undefined {
    return this.map.get(key)?.value;
  }

  delete(key: K): boolean {
    const deleted = this.map.delete(key);
    if (deleted) {
      this.structure += 1;
    }
    return deleted;
  }

  keys(): K[] {
    // Read `structure` so callers that only need the set of keys (not the
    // values) don't get invalidated by unrelated per-key value updates.
    void this.structure;
    return [...this.map.keys()];
  }
}

interface RadListViewInterface<T> {
  Element: NativeElementNode<NativeRadListView>;
  Args: {
    items: T[];
    key?: string;
  };
  Blocks: {
    header: [];
    footer: [];
    item: [T];
  };
}

export default class RadListView<T = any> extends Component<
  RadListViewInterface<T>
> {
  elementRefs: TrackedMap<NativeElementNode<StackLayout>, T> =
    new TrackedMap();
  @tracked private listView: NativeElementNode<NativeRadListView> | undefined;
  private declare headerElement: NativeElementNode<StackLayout>;
  private declare footerElement: NativeElementNode<StackLayout>;

  cleanup(listView: NativeElementNode<NativeRadListView>) {
    for (const element of this.elementRefs.keys()) {
      const n = element.nativeView.nativeViewProtected;
      if (!n || !n.getWindowToken()) {
        this.elementRefs.delete(element);
        const idx = listView.childNodes.findIndex((c) => c === element);
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
    const elementRefs = this.elementRefs;
    // Only the set of keys is read here, so updating a single row's
    // bindingContext (via elementRefs.set) doesn't invalidate this getter
    // for the other rows; `item` is read per-row in the template instead.
    return elementRefs.keys().map((element) => {
      return {
        element,
        get item() {
          return elementRefs.get(element);
        },
      };
    });
  }

  setupListView = modifier(
    function setupListView(
      this: RadListView,
      listView: NativeElementNode<NativeRadListView>,
    ) {
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
          set(v: any) {
            this._parent = v;
            Object.defineProperty(v, 'bindingContext', {
              get() {
                return listViewComponent.elementRefs.get(sl);
              },
              set(v: any) {
                listViewComponent.elementRefs.set(sl, v);
              },
            });
          },
        });
        return sl.nativeView;
      }
      listView.nativeView.itemViewLoader = (type) => {
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
    }.bind(this),
  );

  setupHeader = () => {
    this.headerElement = DocumentNode.createElement('stack-layout');
  };

  setupFooter = () => {
    this.footerElement = DocumentNode.createElement('stack-layout');
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
      {{#each this.items key=this.itemKey as |item|}}
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
