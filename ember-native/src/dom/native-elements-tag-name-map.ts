import type NativeElementNode from './native/NativeElementNode.ts';
import type { ListView, StackLayout } from '@nativescript/core';
import type PageElement from './native/PageElement.ts';

export interface NativeElementsTagNameMap {
  'list-view': NativeElementNode<ListView>;
  'stack-layout': NativeElementNode<StackLayout>;
  page: PageElement;
  fragment: NativeElementNode<null>;
}
