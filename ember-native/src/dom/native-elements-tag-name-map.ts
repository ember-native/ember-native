import type NativeElementNode from './native/NativeElementNode.ts';
import type { ListView, StackLayout } from '@nativescript/core';
import type { RadListView } from 'nativescript-ui-listview';
import type PageElement from './native/PageElement.ts';

export interface NativeElementsTagNameMap {
  'rad-list-view': NativeElementNode<RadListView>;
  'list-view': NativeElementNode<ListView>;
  'stack-layout': NativeElementNode<StackLayout>;
  page: PageElement;
  fragment: NativeElementNode<null>;
}
