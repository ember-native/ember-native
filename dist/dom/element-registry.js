
const elementMap = {};
const dashRegExp = /-/g;
const defaultViewMeta = {
  skipAddToDom: false,
  isUnaryTag: false,
  tagNamespace: '',
  canBeLeftOpenTag: false,
  component: null
};
function normalizeElementName(elementName) {
  return `${elementName.replace(dashRegExp, '').toLowerCase()}`;
}
function registerElement(elementName, resolver, meta = null) {
  const normalizedName = normalizeElementName(elementName);
  meta = Object.assign({}, defaultViewMeta, meta);
  if (elementMap[normalizedName]) {
    throw new Error(`Element for ${elementName} already registered.`);
  }
  const entry = {
    resolver: resolver,
    meta: meta
  };
  const dashName = elementName.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
  elementMap[normalizedName] = entry;
  elementMap[dashName] = entry;
  elementMap[elementName] = entry;
}
function getElementMap() {
  return elementMap;
}
function getViewClass(elementName) {
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
function getViewMeta(elementName) {
  const normalizedName = normalizeElementName(elementName);
  let meta = defaultViewMeta;
  const entry = elementMap[normalizedName];
  if (entry && entry.meta) {
    meta = entry.meta;
  }
  return meta;
}
function isKnownView(elementName) {
  return elementMap[normalizeElementName(elementName)];
}
function createElement(elementName) {
  const normalizedName = normalizeElementName(elementName);
  const elementDefinition = elementMap[normalizedName];
  if (!elementDefinition) {
    throw new TypeError(`No known component for element ${elementName}.`);
  }
  return elementDefinition.resolver();
}

export { createElement, getElementMap, getViewClass, getViewMeta, isKnownView, normalizeElementName, registerElement };
//# sourceMappingURL=element-registry.js.map
