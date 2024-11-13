import { modifier } from 'ember-modifier';

export const ref = modifier(function setRef(element, [context, key]: [any, string]) {
  context[key] = element;
})
