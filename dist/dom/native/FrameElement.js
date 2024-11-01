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
var frame_1 = require("@nativescript/core/ui/frame");
var element_registry_1 = require("../element-registry");
var NativeElementNode_1 = require("./NativeElementNode");
var page_1 = require("@nativescript/core/ui/page");
var FrameElement = /** @class */ (function (_super) {
    __extends(FrameElement, _super);
    function FrameElement() {
        return _super.call(this, 'frame', frame_1.Frame, null) || this;
    }
    FrameElement.prototype.setAttribute = function (key, value) {
        if (key.toLowerCase() == 'defaultpage') {
            var dummy_1 = (0, element_registry_1.createElement)('fragment');
            this.nativeView.navigate({
                create: function () { return dummy_1.firstElement().nativeView; }
            });
        }
        _super.prototype.setAttribute.call(this, key, value);
    };
    Object.defineProperty(FrameElement.prototype, "nativeView", {
        get: function () {
            return _super.prototype.nativeView;
        },
        set: function (view) {
            _super.prototype.nativeView = view;
        },
        enumerable: false,
        configurable: true
    });
    //In regular native script, Frame elements aren't meant to have children, we instead allow it to have one.. a page.. as a convenience
    // and set the instance as the default page by navigating to it.
    FrameElement.prototype.appendChild = function (childNode) {
        //only handle page nodes
        console.log('appendChild', childNode);
        if (childNode.nativeView instanceof page_1.Page) {
            console.log('navigate', childNode);
            this.currentPage = childNode.nativeView;
            this.nativeView.navigate({
                create: function () { return childNode.nativeView; },
                clearHistory: true,
                backstackVisible: false,
                transition: {}
            });
        }
        _super.prototype.appendChild.call(this, childNode);
        return;
    };
    FrameElement.prototype.onInsertedChild = function (childNode) {
        if (childNode.nativeView instanceof page_1.Page && this.currentPage !== childNode.nativeView) {
            console.log('navigate', childNode);
            this.nativeView.navigate({
                create: function () { return childNode.nativeView; },
                clearHistory: true,
                backstackVisible: false,
                transition: {}
            });
        }
    };
    FrameElement.prototype.removeChild = function (childNode) {
        if (!childNode) {
            return;
        }
        if (!childNode.parentNode) {
            return;
        }
        if (childNode.parentNode !== this) {
            return;
        }
        childNode.parentNode = null;
        // reset the prevSibling and nextSibling. If not, a keep-alived component will
        // still have a filled nextSibling attribute so vue will not
        // insert the node again to the parent. See #220
        childNode.prevSibling = null;
        childNode.nextSibling = null;
        this.childNodes = this.childNodes.filter(function (node) { return node !== childNode; });
        childNode.removeChildren();
        this.onRemovedChild(childNode);
    };
    return FrameElement;
}(NativeElementNode_1.default));
exports.default = FrameElement;
