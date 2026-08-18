import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { tracked } from '@glimmer/tracking';
import {
  RadListView as NativeRadListView,
  ListViewViewType,
} from 'nativescript-ui-listview';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
import DocumentNode from '../dom/nodes/DocumentNode.ts';
import TrackedMap from './tracked-map.ts';
import { glimmerTrackedMapHooks } from './tracked-map-glimmer.ts';
import type { StackLayout } from '@nativescript/core';

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
  elementRefs: TrackedMap<NativeElementNode<StackLayout>, T> = new TrackedMap(
    glimmerTrackedMapHooks(),
  );
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
