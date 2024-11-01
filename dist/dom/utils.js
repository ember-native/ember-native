"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isView = isView;
exports.isLayout = isLayout;
exports.isContentView = isContentView;
var content_view_1 = require("@nativescript/core/ui/content-view");
var view_1 = require("@nativescript/core/ui/core/view");
var layout_base_1 = require("@nativescript/core/ui/layouts/layout-base");
function isView(view) {
    return view instanceof view_1.View;
}
function isLayout(view) {
    return view instanceof layout_base_1.LayoutBase;
}
function isContentView(view) {
    return view instanceof content_view_1.ContentView;
}
