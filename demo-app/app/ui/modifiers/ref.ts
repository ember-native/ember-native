import { modifier } from 'ember-modifier';

export const ref = modifier(function setRef<T>(element: Element, [context, key]: [T, keyof T]) {
  (context as any)[key] = element;
})
