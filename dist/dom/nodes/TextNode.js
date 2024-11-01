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
var ViewNode_1 = require("./ViewNode");
var TextNode = /** @class */ (function (_super) {
    __extends(TextNode, _super);
    function TextNode(text) {
        var _this = _super.call(this) || this;
        _this.nodeType = 3;
        _this.text = text;
        _this._meta = {
            skipAddToDom: true
        };
        return _this;
    }
    Object.defineProperty(TextNode.prototype, "parentNode", {
        get: function () {
            return this._parentNode;
        },
        set: function (node) {
            this._parentNode = node;
            this.setText(this.text);
        },
        enumerable: false,
        configurable: true
    });
    TextNode.prototype.setText = function (text) {
        var _a;
        this.text = text;
        if (((_a = this.parentNode) === null || _a === void 0 ? void 0 : _a.nativeView) instanceof TextBase) {
            this.parentNode.updateText();
        }
    };
    return TextNode;
}(ViewNode_1.default));
exports.default = TextNode;
