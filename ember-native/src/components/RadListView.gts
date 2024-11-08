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

class TrackedMap extends Map<any, any> {
  @tracked counter = 0;
  set(key: any, value: any): this {
    this.counter += 1;
    super.set(key, value);
    return this;
  }

  get(key: any): any {
    if (this.counter === 0) return null;
    return super.get(key);
  }

  entries(): any {
    if (this.counter === 0) return super.entries();
    return super.entries();
  }
}

interface RadListViewInterface<T> {
  Element: NativeElementNode<NativeRadListView>;
  Args: {
    items: T[];
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
  elementRefs: TrackedMap = new TrackedMap();
  @tracked private listView: NativeElementNode<NativeRadListView> | undefined;
  private declare headerElement: NativeElementNode<StackLayout>;
  private declare footerElement: NativeElementNode<StackLayout>;

  get items() {
    return [...this.elementRefs.entries()].map(([element, item]) => {
      return {
        item,
        element,
      };
    });
  }

  setupListView = modifier(
    function setupListView(
      this: RadListView,
      listView: NativeElementNode<NativeRadListView>,
    ) {
      this.listView = listView;
      const listViewComponent = this;
      function _getDefaultItemContent() {
        const sl = DocumentNode.createElement('stack-layout');
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
