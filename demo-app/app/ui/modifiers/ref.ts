import { modifier } from 'ember-modifier';
import NativeElementNode from 'ember-native/dom/native/NativeElementNode';
import { ViewBase } from '@nativescript/core';


export const ref = modifier(function setRef<T>(element: NativeElementNode<ViewBase>, [context, key]: [T, keyof T]) {
  (context as any)[key] = element;
})
