"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeElementName = normalizeElementName;
exports.registerElement = registerElement;
exports.getElementMap = getElementMap;
exports.getViewClass = getViewClass;
exports.getViewMeta = getViewMeta;
exports.isKnownView = isKnownView;
exports.createElement = createElement;
var elementMap = {};
var dashRegExp = /-/g;
var defaultViewMeta = {
    skipAddToDom: false,
    isUnaryTag: false,
    tagNamespace: '',
    canBeLeftOpenTag: false,
    component: null
};
function normalizeElementName(elementName) {
    // console.log(`Normalize Element name ${elementName}`);
    return "".concat(elementName.replace(dashRegExp, '').toLowerCase());
}
// export function registerNativeElement(elementName: string, resolver: () => typeof View, meta: ComponentMeta = null) {
//     registerElement(elementName, () => new NativeNode(elementName, resolver(), meta));
// }
function registerElement(elementName, resolver, meta) {
    if (meta === void 0) { meta = null; }
    var normalizedName = normalizeElementName(elementName);
    meta = Object.assign({}, defaultViewMeta, meta);
    if (elementMap[normalizedName]) {
        throw new Error("Element for ".concat(elementName, " already registered."));
    }
    var entry = {
        resolver: resolver,
        meta: meta
    };
    var dashName = elementName.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
    elementMap[normalizedName] = entry;
    elementMap[dashName] = entry;
    elementMap[elementName] = entry;
}
function getElementMap() {
    return elementMap;
}
function getViewClass(elementName) {
    var normalizedName = normalizeElementName(elementName);
    var entry = elementMap[normalizedName];
    if (!entry) {
        throw new TypeError("No known component for element ".concat(elementName, "."));
    }
    try {
        return entry.resolver();
    }
    catch (e) {
        throw new TypeError("Could not load view for: ".concat(elementName, ". ").concat(e));
    }
}
function getViewMeta(elementName) {
    var normalizedName = normalizeElementName(elementName);
    var meta = defaultViewMeta;
    var entry = elementMap[normalizedName];
    if (entry && entry.meta) {
        meta = entry.meta;
    }
    return meta;
}
function isKnownView(elementName) {
    return elementMap[normalizeElementName(elementName)];
}
function createElement(elementName) {
    var normalizedName = normalizeElementName(elementName);
    var elementDefinition = elementMap[normalizedName];
    if (!elementDefinition) {
        throw new TypeError("No known component for element ".concat(elementName, "."));
    }
    return elementDefinition.resolver();
}
