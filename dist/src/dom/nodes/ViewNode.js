"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@nativescript/core");
var types_1 = require("@nativescript/core/utils/types");
var element_registry_1 = require("../element-registry");
var text_base_1 = require("@nativescript/core/ui/text-base");
var XML_ATTRIBUTES = Object.freeze(['tap', 'style', 'rows', 'columns', 'fontAttributes']);
function elementIterator(el) {
    var _i, _a, child;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, el];
            case 1:
                _b.sent();
                _i = 0, _a = el.childNodes;
                _b.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 5];
                child = _a[_i];
                return [5 /*yield**/, __values(elementIterator(child))];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/];
        }
    });
}
var ViewNode = /** @class */ (function () {
    function ViewNode() {
        this.nodeType = null;
        this._tagName = null;
        this.parentNode = null;
        this.childNodes = [];
        this.prevSibling = null;
        this.nextSibling = null;
        this._ownerDocument = null;
        this._nativeView = null;
        this._meta = null;
        this.attributes = [];
    }
    ViewNode.prototype.getElementById = function (id) {
        for (var _i = 0, _a = elementIterator(this); _i < _a.length; _i++) {
            var el = _a[_i];
            if (el.nodeType === 1 && el.id === id)
                return el;
        }
    };
    ViewNode.prototype.getElementByClass = function (klass) {
        for (var _i = 0, _a = elementIterator(this); _i < _a.length; _i++) {
            var el = _a[_i];
            if (el.nodeType === 1 && el.classList.contains(klass))
                return el;
        }
    };
    ViewNode.prototype.getElementByTagName = function (tagName) {
        for (var _i = 0, _a = elementIterator(this); _i < _a.length; _i++) {
            var el = _a[_i];
            if (el.nodeType === 1 && el.tagName === tagName)
                return el;
        }
    };
    ViewNode.prototype.querySelector = function (selector) {
        console.log('querySelector', selector);
        if (selector.startsWith('.')) {
            return this.getElementByClass(selector.slice(1));
        }
        if (selector.startsWith('#')) {
            return this.getElementById(selector.slice(1));
        }
        return this.getElementByTagName(selector);
    };
    ViewNode.prototype.contains = function (otherElement) {
        return false;
    };
    ViewNode.prototype.hasAttribute = function () {
        return false;
    };
    ViewNode.prototype.removeAttribute = function () {
        return false;
    };
    /* istanbul ignore next */
    ViewNode.prototype.toString = function () {
        return "".concat(this.constructor.name, "(").concat(this.tagName, ")");
    };
    Object.defineProperty(ViewNode.prototype, "tagName", {
        get: function () {
            return this._tagName;
        },
        set: function (name) {
            this._tagName = (0, element_registry_1.normalizeElementName)(name);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ViewNode.prototype, "firstChild", {
        get: function () {
            return this.childNodes.length ? this.childNodes[0] : null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ViewNode.prototype, "lastChild", {
        get: function () {
            return this.childNodes.length ? this.childNodes[this.childNodes.length - 1] : null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ViewNode.prototype, "nativeView", {
        get: function () {
            return this._nativeView;
        },
        set: function (view) {
            this._nativeView = view;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ViewNode.prototype, "meta", {
        get: function () {
            if (this._meta) {
                return this._meta;
            }
            return (this._meta = (0, element_registry_1.getViewMeta)(this.tagName));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ViewNode.prototype, "isConnected", {
        get: function () {
            return Boolean(this.ownerDocument);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ViewNode.prototype, "ownerDocument", {
        /* istanbul ignore next */
        get: function () {
            var el = this;
            while (el != null && el.nodeType !== 9) {
                el = el.parentNode || el._ownerDocument;
            }
            if ((el === null || el === void 0 ? void 0 : el.nodeType) === 9) {
                return el;
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    ViewNode.prototype.getAttribute = function (key) {
        if (this.nativeView) {
            return this.nativeView[key];
        }
        else {
            return this[key];
        }
    };
    /* istanbul ignore next */
    ViewNode.prototype.setAttribute = function (key, value) {
        var nv = this.nativeView;
        this.attributes.push({
            nodeName: key,
            nodeValue: value,
        });
        if (!nv) {
            this[key] = value;
            return;
        }
        // normalize key
        if (core_1.isAndroid && key.startsWith('android:')) {
            key = key.substr(8);
        }
        if (core_1.isIOS && key.startsWith('ios:')) {
            key = key.substr(4);
        }
        // try to fix case
        var lowerkey = key.toLowerCase();
        for (var realKey in nv) {
            if (lowerkey == realKey.toLowerCase()) {
                key = realKey;
                break;
            }
        }
        try {
            if (XML_ATTRIBUTES.indexOf(key) !== -1) {
                nv[key] = value;
            }
            else {
                // detect expandable attrs for boolean values
                // See https://vuejs.org/v2/guide/components-props.html#Passing-a-Boolean
                if ((0, types_1.isBoolean)(nv[key]) && value === '') {
                    value = true;
                }
                else {
                    nv[key] = value;
                }
            }
        }
        catch (e) {
            // ignore but log
            console.warn("set attribute threw an error, attr:".concat(key, " on ").concat(this._tagName, ": ").concat(e.message));
        }
    };
    /* istanbul ignore next */
    ViewNode.prototype.setStyle = function (property, value) {
        if (!(value = value.trim()).length) {
            return;
        }
        if (property.endsWith('Align')) {
            // NativeScript uses Alignment instead of Align, this ensures that text-align works
            property += 'ment';
        }
        this.nativeView.style[property] = value;
    };
    Object.defineProperty(ViewNode.prototype, "style", {
        get: function () {
            var _a;
            return (_a = this.nativeView) === null || _a === void 0 ? void 0 : _a.style;
        },
        set: function (v) {
            var _a;
            Object.assign((_a = this.nativeView) === null || _a === void 0 ? void 0 : _a.style, v);
        },
        enumerable: false,
        configurable: true
    });
    ViewNode.prototype.updateText = function () {
        var hasTextAttr = this.nativeView instanceof text_base_1.TextBase;
        if (hasTextAttr) {
            var t = this.childNodes.map(function (c) { return c.text; }).filter(Boolean).join('');
            this.setAttribute('text', t.trim());
        }
    };
    /* istanbul ignore next */
    ViewNode.prototype.addEventListener = function (event, handler) {
        var _a;
        (_a = this.nativeView) === null || _a === void 0 ? void 0 : _a.on(event, handler);
    };
    /* istanbul ignore next */
    ViewNode.prototype.removeEventListener = function (event, handler) {
        var _a;
        (_a = this.nativeView) === null || _a === void 0 ? void 0 : _a.off(event, handler);
    };
    ViewNode.prototype.dispatchEvent = function (event) {
        if (this.nativeView) {
            //nativescript uses the EventName while dom uses Type
            event.eventName = event.type;
            this.nativeView.notify(event);
        }
    };
    ViewNode.prototype.onInsertedChild = function (childNode, index) {
    };
    ViewNode.prototype.onRemovedChild = function (childNode) {
    };
    ViewNode.prototype.insertBefore = function (childNode, referenceNode) {
        if (!childNode) {
            throw new Error("Can't insert child.");
        }
        // in some rare cases insertBefore is called with a null referenceNode
        // this makes sure that it get's appended as the last child
        if (!referenceNode) {
            return this.appendChild(childNode);
        }
        if (referenceNode.parentNode !== this) {
            throw new Error("Can't insert child, because the reference node has a different parent.");
        }
        if (childNode.parentNode && childNode.parentNode !== this) {
            throw new Error("Can't insert child, because it already has a different parent.");
        }
        if (childNode.parentNode === this) {
            // we don't need to throw an error here, because it is a valid case
            // for example when switching the order of elements in the tree
            // fixes #127 - see for more details
            // fixes #240
            // throw new Error(`Can't insert child, because it is already a child.`)
        }
        var index = this.childNodes.indexOf(referenceNode);
        childNode.nextSibling = referenceNode;
        childNode.prevSibling = this.childNodes[index - 1];
        this.childNodes[index - 1].nextSibling = childNode;
        referenceNode.prevSibling = childNode;
        this.childNodes.splice(index, 0, childNode);
        childNode.parentNode = this;
        this.onInsertedChild(childNode, index);
    };
    ViewNode.prototype.appendChild = function (childNode) {
        if (!childNode) {
            throw new Error("Can't append null child.");
        }
        if (childNode.parentNode && childNode.parentNode !== this) {
            throw new Error("Can't append child, because it already has a different parent.");
        }
        if (childNode.parentNode === this) {
            // we don't need to throw an error here, because it is a valid case
            // for example when switching the order of elements in the tree
            // fixes #127 - see for more details
            // fixes #240
            // throw new Error(`Can't append child, because it is already a child.`)
        }
        if (this.lastChild) {
            childNode.prevSibling = this.lastChild;
            this.lastChild.nextSibling = childNode;
        }
        this.childNodes.push(childNode);
        childNode.parentNode = this;
        this.onInsertedChild(childNode, this.childNodes.length - 1);
    };
    ViewNode.prototype.removeChild = function (childNode) {
        if (!childNode) {
            throw new Error("Can't remove child.");
        }
        if (!childNode.parentNode) {
            throw new Error("Can't remove child, because it has no parent.");
        }
        if (childNode.parentNode !== this) {
            throw new Error("Can't remove child, because it has a different parent.");
        }
        childNode.parentNode = null;
        if (childNode.prevSibling) {
            childNode.prevSibling.nextSibling = childNode.nextSibling;
        }
        if (childNode.nextSibling) {
            childNode.nextSibling.prevSibling = childNode.prevSibling;
        }
        // reset the prevSibling and nextSibling. If not, a keep-alived component will
        // still have a filled nextSibling attribute so vue will not
        // insert the node again to the parent. See #220
        // childNode.prevSibling = null;
        // childNode.nextSibling = null;
        this.childNodes = this.childNodes.filter(function (node) { return node !== childNode; });
        this.onRemovedChild(childNode);
    };
    ViewNode.prototype.clear = function (node) {
        while (node.childNodes.length) {
            this.clear(node.firstChild);
        }
        node.parentNode.removeChild(node);
    };
    ViewNode.prototype.removeChildren = function () {
        while (this.childNodes.length) {
            this.clear(this.firstChild);
        }
    };
    ViewNode.prototype.firstElement = function () {
        for (var _i = 0, _a = this.childNodes; _i < _a.length; _i++) {
            var child = _a[_i];
            if (child.nodeType == 1) {
                return child;
            }
        }
        return null;
    };
    ViewNode.prototype.getBoundingClientRect = function () {
        if (!this.nativeView)
            return null;
        if (!this.nativeView.getLocationInWindow)
            return null;
        var point = this.nativeView.getLocationInWindow();
        var actualSize = this.nativeView.getActualSize();
        return {
            left: point.x,
            top: point.y,
            bottom: point.y + actualSize.height,
            width: actualSize.width,
            height: actualSize.height,
        };
    };
    return ViewNode;
}());
exports.default = ViewNode;
