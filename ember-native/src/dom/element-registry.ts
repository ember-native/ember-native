import type { NativeElementsTagNameMap } from './native-elements-tag-name-map.ts';
import type NativeElementNode from './native/NativeElementNode.ts';

const elementMap: Record<string, any> = {};
const dashRegExp = /-/g;

const defaultViewMeta = {
  skipAddToDom: false,
  isUnaryTag: false,
  tagNamespace: '',
  canBeLeftOpenTag: false,
  component: null,
};

export function normalizeElementName(elementName: string) {
  return `${elementName.replace(dashRegExp, '').toLowerCase()}`;
}

export function registerElement(
  elementName: string,
  resolver: () => NativeElementNode,
  meta: object | null = null,
) {
  const normalizedName = normalizeElementName(elementName);

  meta = Object.assign({}, defaultViewMeta, meta);

  if (elementMap[normalizedName]) {
    throw new Error(`Element for ${elementName} already registered.`);
  }

  const entry = {
    resolver: resolver,
    meta: meta,
  };
  const dashName = elementName
    .replace(/([a-zA-Z])(?=[A-Z])/g, '$1-')
    .toLowerCase();
  elementMap[normalizedName] = entry;
  elementMap[dashName] = entry;
  elementMap[elementName] = entry;
}

export function getElementMap() {
  return elementMap;
}

export function getViewClass(elementName: string) {
  const normalizedName = normalizeElementName(elementName);
  const entry = elementMap[normalizedName];

  if (!entry) {
    throw new TypeError(`No known component for element ${elementName}.`);
  }

  try {
    return entry.resolver();
  } catch (e) {
    throw new TypeError(`Could not load view for: ${elementName}. ${e}`);
  }
}

export function getViewMeta(elementName: string) {
  const normalizedName = normalizeElementName(elementName);

  let meta = defaultViewMeta;
  const entry = elementMap[normalizedName];

  if (entry && entry.meta) {
    meta = entry.meta;
  }

  return meta;
}

export function isKnownView(elementName: string) {
  return elementMap[normalizeElementName(elementName)];
}

export function createElement<T extends keyof NativeElementsTagNameMap>(
  elementName: T,
): NativeElementsTagNameMap[T] {
  const normalizedName = normalizeElementName(elementName);
  const elementDefinition = elementMap[normalizedName];
  if (!elementDefinition) {
    throw new TypeError(`No known component for element ${elementName}.`);
  }
  return elementDefinition.resolver();
}
