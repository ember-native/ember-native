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
var page_1 = require("@nativescript/core/ui/page");
var NativeElementNode_1 = require("./NativeElementNode");
var PageElement = /** @class */ (function (_super) {
    __extends(PageElement, _super);
    function PageElement() {
        return _super.call(this, 'page', page_1.Page, null) || this;
    }
    Object.defineProperty(PageElement.prototype, "nativeView", {
        get: function () {
            return _super.prototype.nativeView;
        },
        set: function (view) {
            _super.prototype.nativeView = view;
        },
        enumerable: false,
        configurable: true
    });
    return PageElement;
}(NativeElementNode_1.default));
exports.default = PageElement;
