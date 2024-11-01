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
Object.defineProperty(exports, "__esModule", { value: true });
var element_registry_1 = require("../element-registry");
var ElementNode_1 = require("./ElementNode");
var PropertyNode = /** @class */ (function (_super) {
    __extends(PropertyNode, _super);
    function PropertyNode(tagName, propertyName) {
        var _this = _super.call(this, "".concat(tagName, ".").concat(propertyName)) || this;
        _this.propertyName = propertyName;
        _this.propertyTagName = (0, element_registry_1.normalizeElementName)(tagName);
        _this.nodeType = 7; //processing instruction
        return _this;
    }
    PropertyNode.prototype.onInsertedChild = function () {
        this.setOnNode(this.parentNode);
    };
    PropertyNode.prototype.onRemovedChild = function () {
        this.setOnNode(this.parentNode);
    };
    /* istanbul ignore next */
    PropertyNode.prototype.toString = function () {
        return "".concat(this.constructor.name, "(").concat(this.tagName, ", ").concat(this.propertyName, ")");
    };
    PropertyNode.prototype.setOnNode = function (parent) {
        if (parent && parent.tagName === this.propertyTagName) {
            var el = this.firstElement();
            parent.setAttribute(this.propertyName, el);
        }
    };
    PropertyNode.prototype.clearOnNode = function (parent) {
        if (parent && parent.tagName === this.propertyTagName) {
            parent.setAttribute(this.propertyName, null);
        }
    };
    return PropertyNode;
}(ElementNode_1.default));
exports.default = PropertyNode;
