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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var ViewNode_1 = require("./ViewNode");
var ElementNode = /** @class */ (function (_super) {
    __extends(ElementNode, _super);
    function ElementNode(tagName) {
        var _this = _super.call(this) || this;
        _this.nodeType = 1;
        _this.tagName = tagName;
        return _this;
    }
    Object.defineProperty(ElementNode.prototype, "id", {
        get: function () {
            return this.getAttribute('id');
        },
        set: function (value) {
            this.setAttribute('id', value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ElementNode.prototype, "classList", {
        get: function () {
            var _this = this;
            if (!this._classList) {
                var getClasses_1 = function () { return (_this.getAttribute('class') || '').split(/\s+/).filter(function (k) { return k != ''; }); };
                this._classList = {
                    add: function () {
                        var classNames = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            classNames[_i] = arguments[_i];
                        }
                        _this.setAttribute('class', __spreadArray([], new Set(getClasses_1().concat(classNames)), true).join(' '));
                    },
                    contains: function (klass) {
                        return getClasses_1().find(function (x) { return x === klass; });
                    },
                    remove: function () {
                        var classNames = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            classNames[_i] = arguments[_i];
                        }
                        _this.setAttribute('class', getClasses_1()
                            .filter(function (i) { return classNames.indexOf(i) == -1; })
                            .join(' '));
                    },
                    get length() {
                        return getClasses_1().length;
                    }
                };
            }
            return this._classList;
        },
        enumerable: false,
        configurable: true
    });
    ElementNode.prototype.appendChild = function (childNode) {
        _super.prototype.appendChild.call(this, childNode);
        if (childNode.nodeType === 3) {
            this.updateText();
        }
        if (childNode.nodeType === 7) {
            childNode.setOnNode(this);
        }
    };
    ElementNode.prototype.insertBefore = function (childNode, referenceNode) {
        _super.prototype.insertBefore.call(this, childNode, referenceNode);
        if (childNode.nodeType === 3) {
            this.updateText();
        }
        if (childNode.nodeType === 7) {
            childNode.setOnNode(this);
        }
    };
    ElementNode.prototype.removeChild = function (childNode) {
        _super.prototype.removeChild.call(this, childNode);
        if (childNode.nodeType === 3) {
            this.updateText();
        }
        if (childNode.nodeType === 7) {
            childNode.clearOnNode(this);
        }
    };
    return ElementNode;
}(ViewNode_1.default));
exports.default = ElementNode;
