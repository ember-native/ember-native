"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var element_registry_1 = require("../element-registry");
var CommentNode_1 = require("./CommentNode");
var ElementNode_1 = require("./ElementNode");
var PropertyNode_1 = require("./PropertyNode");
var TextNode_1 = require("./TextNode");
var ViewNode_1 = require("./ViewNode");
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
var HeadNode = /** @class */ (function (_super) {
    __extends(HeadNode, _super);
    function HeadNode(tagName, document) {
        var _this = _super.call(this, tagName) || this;
        _this.document = document;
        return _this;
    }
    HeadNode.prototype.appendChild = function (childNode) {
        if (childNode.tagName === 'style') {
            console.log('append style', this.document.page);
            this.document.page.nativeView.addCss(childNode.childNodes[0].text);
            return;
        }
        _super.prototype.appendChild.call(this, childNode);
    };
    return HeadNode;
}(ElementNode_1.default));
var DocumentNode = /** @class */ (function (_super) {
    __extends(DocumentNode, _super);
    function DocumentNode() {
        var _this = _super.call(this) || this;
        _this.documentElement = {
            dataset: {}
        };
        _this.tagName = 'docNode';
        _this.nodeType = 9;
        _this.head = new HeadNode('head', _this);
        _this.appendChild(_this.head);
        _this.nodeMap = new Map();
        return _this;
    }
    DocumentNode.prototype.createComment = function (text) {
        return new CommentNode_1.default(text);
    };
    DocumentNode.prototype.createPropertyNode = function (tagName, propertyName) {
        return new PropertyNode_1.default(tagName, propertyName);
    };
    DocumentNode.prototype.createElement = function (tagName) {
        if (tagName.indexOf('.') >= 0) {
            var bits = tagName.split('.', 2);
            return this.createPropertyNode(bits[0], bits[1]);
        }
        console.log((0, element_registry_1.createElement)(tagName));
        var e = (0, element_registry_1.createElement)(tagName);
        e._ownerDocument = this;
        if (e.nativeView) {
            this.nodeMap.set(e.nativeView._domId, e);
        }
        if (tagName === 'page') {
            this.page = e;
            Object.defineProperty(this, 'body', {
                configurable: true,
                get: function () {
                    var page = this.page;
                    return {
                        insertAdjacentHTML: function (location, html) {
                            return null;
                        },
                        addEventListener: globalThis.addEventListener.bind(this.page),
                        get lastChild() {
                            return null;
                        }
                    };
                }
            });
        }
        return e;
    };
    DocumentNode.prototype.createElementNS = function (namespace, tagName) {
        return this.createElement(tagName);
    };
    DocumentNode.prototype.createTextNode = function (text) {
        console.log('createTextNode', text);
        return new TextNode_1.default(text);
    };
    DocumentNode.prototype.addEventListener = function (event, callback) {
        if (event === 'DOMContentLoaded') {
            setTimeout(callback, 0);
            return;
        }
        console.error('unsupported event on document', event);
    };
    DocumentNode.prototype.removeEventListener = function (event, handler) {
        if (event === 'DOMContentLoaded') {
            return;
        }
        console.error('unsupported event on document', event);
    };
    DocumentNode.prototype.searchDom = function (node, startNode, endNode) {
        var start = startNode || this.page;
        if (start === node) {
            return true;
        }
        if (node === endNode) {
            return false;
        }
        for (var _i = 0, _a = start.childNodes; _i < _a.length; _i++) {
            var childNode = _a[_i];
            if (this.searchDom(node, childNode, endNode)) {
                return true;
            }
        }
        var sibling = node;
        while (sibling) {
            if (this.searchDom(node, sibling, endNode)) {
                return true;
            }
            sibling = sibling.nextSibling;
        }
        return false;
    };
    DocumentNode.prototype.createRange = function () {
        var self = this;
        return {
            startNode: null,
            endNode: null,
            setStartBefore: function (startNode) {
                while (startNode && !startNode.nativeView) {
                    startNode = startNode.nextSibling;
                }
                this.startNode = startNode;
            },
            setEndAfter: function (endNode) {
                while (endNode && !endNode.nativeView) {
                    endNode = endNode.prevSibling;
                }
                this.endNode = endNode;
            },
            isPointInRange: function (dom, number) {
                return self.searchDom(dom, this.startNode, this.endNode);
            },
            getBoundingClientRect: function () {
                if (!this.startNode.nativeView)
                    return null;
                var point = this.startNode.nativeView.getLocationInWindow();
                var size = this.startNode.nativeView.getActualSize();
                var x = point.x;
                var y = point.y;
                var width = size.width;
                var height = size.height;
                for (var _i = 0, _a = elementIterator(this.startNode); _i < _a.length; _i++) {
                    var element = _a[_i];
                    var point_1 = element.nativeView.getLocationInWindow();
                    var size_1 = element.nativeView.getActualSize();
                    x = Math.min(x, point_1.x);
                    y = Math.min(y, point_1.y);
                    width = point_1.x + size_1.width - x;
                    height = point_1.y + size_1.height - y;
                    if (element === this.endNode) {
                        break;
                    }
                }
                return {
                    left: x,
                    top: y,
                    bottom: y + height,
                    width: width,
                    height: height,
                };
            }
        };
    };
    DocumentNode.prototype.querySelectorAll = function (selector) {
        if (selector.startsWith('meta')) {
            return {
                getAttribute: function () {
                    return JSON.stringify(this.config);
                }
            };
        }
    };
    return DocumentNode;
}(ViewNode_1.default));
exports.default = DocumentNode;
