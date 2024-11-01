"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNativeElement = registerNativeElement;
exports.registerElements = registerElements;
var element_registry_1 = require("./element-registry");
var FrameElement_1 = require("./native/FrameElement");
var NativeElementNode_1 = require("./native/NativeElementNode");
var PageElement_1 = require("./native/PageElement");
var ElementNode_1 = require("./nodes/ElementNode");
function registerNativeElement(elementName, resolver, meta) {
    if (meta === void 0) { meta = null; }
    (0, element_registry_1.registerElement)(elementName, function () { return new NativeElementNode_1.default(elementName, resolver(), meta); });
}
function registerElements() {
    var _this = this;
    (0, element_registry_1.registerElement)('head', function () { return null; }, {
        insertChild: function (parentNode, childNode, atIndex) {
        }
    });
    (0, element_registry_1.registerElement)('style', function () { return new ElementNode_1.default('style', _this); });
    // registerElement('Frame', () => require('@nativescript/core/ui/frame').Frame, {
    //     insertChild(parentNode, childNode, atIndex) {
    //         //dont bother
    //     }
    // });
    (0, element_registry_1.registerElement)('div', function () { return require('@nativescript/core/ui/frame').Frame; }, {
        insertChild: function (parentNode, childNode, atIndex) {
            console.log('div elem', parentNode, childNode, atIndex);
            //dont bother
            parentNode.appendChild(childNode);
        }
    });
    // Completed
    registerNativeElement('AbsoluteLayout', function () { return require('@nativescript/core/ui/layouts/absolute-layout').AbsoluteLayout; });
    registerNativeElement('ActionBar', function () { return require('@nativescript/core/ui/action-bar').ActionBar; });
    registerNativeElement('ActionItem', function () { return require('@nativescript/core/ui/action-bar').ActionItem; });
    registerNativeElement('ActivityIndicator', function () { return require('@nativescript/core/ui/activity-indicator').ActivityIndicator; });
    registerNativeElement('Border', function () { return require('@nativescript/core/ui/border').Border; });
    registerNativeElement('Comment', function () { return require('@nativescript/core/ui/placeholder').Placeholder; });
    registerNativeElement('Button', function () { return require('@nativescript/core/ui/button').Button; });
    registerNativeElement('DatePicker', function () { return require('@nativescript/core/ui/date-picker').DatePicker; });
    registerNativeElement('DockLayout', function () { return require('@nativescript/core/ui/layouts/dock-layout').DockLayout; });
    registerNativeElement('FlexboxLayout', function () { return require('@nativescript/core/ui/layouts/flexbox-layout').FlexboxLayout; });
    registerNativeElement('FormattedString', function () { return require('@nativescript/core/text/formatted-string').FormattedString; }, {
        insertChild: function (parentNode, childNode, atIndex) {
            var parent = parentNode.nativeView;
            var child = childNode.nativeView;
            parent.spans.splice(atIndex, 0, child);
        }
    });
    registerNativeElement('GridLayout', function () { return require('@nativescript/core/ui/layouts/grid-layout').GridLayout; });
    registerNativeElement('HtmlView', function () { return require('@nativescript/core/ui/html-view').HtmlView; });
    registerNativeElement('Image', function () { return require('@nativescript/core/ui/image').Image; });
    registerNativeElement('Label', function () { return require('@nativescript/core/ui/label').Label; });
    registerNativeElement('ListPicker', function () { return require('@nativescript/core/ui/list-picker').ListPicker; });
    registerNativeElement('NavigationButton', function () { return require('@nativescript/core/ui/action-bar').NavigationButton; });
    // registerNativeElement('Page', () => require('@nativescript/core/ui/page').Page);
    registerNativeElement('Span', function () { return require('@nativescript/core/text/span').Span; });
    registerNativeElement('StackLayout', function () { return require('@nativescript/core/ui/layouts/stack-layout').StackLayout; });
    registerNativeElement('ScrollView', function () { return require('@nativescript/core/ui/scroll-view').ScrollView; });
    registerNativeElement('Switch', function () { return require('@nativescript/core/ui/switch').Switch; });
    registerNativeElement('TabContentItem', function () { return require('@nativescript/core/ui/tab-navigation-base/tab-content-item').TabContentItem; });
    registerNativeElement('Tabs', function () { return require('@nativescript/core/ui/tabs').Tabs; });
    registerNativeElement('TabStrip', function () { return require('@nativescript/core/ui/tab-navigation-base/tab-strip').TabStrip; });
    registerNativeElement('TabStripItem', function () { return require('@nativescript/core/ui/tab-navigation-base/tab-strip-item').TabStripItem; });
    registerNativeElement('TabView', function () { return require('@nativescript/core/ui/tab-view').TabView; });
    registerNativeElement('TabViewItem', function () { return require('@nativescript/core/ui/tab-view').TabViewItem; });
    registerNativeElement('TextField', function () { return require('@nativescript/core/ui/text-field').TextField; });
    registerNativeElement('TextView', function () { return require('@nativescript/core/ui/text-view').TextView; });
    registerNativeElement('WebView', function () { return require('@nativescript/core/ui/web-view').WebView; });
    registerNativeElement('WrapLayout', function () { return require('@nativescript/core/ui/layouts/wrap-layout').WrapLayout; });
    registerNativeElement('ContentView', function () { return require('@nativescript/core/ui/content-view').ContentView; });
    registerNativeElement('ListView', function () { return require('@nativescript/core/ui/list-view').ListView; });
    registerNativeElement('RadListView', function () { return require('nativescript-ui-listview').RadListView; });
    // Not Complete
    (0, element_registry_1.registerElement)('Frame', function () { return new FrameElement_1.default(); });
    (0, element_registry_1.registerElement)('Page', function () { return new PageElement_1.default(); });
    (0, element_registry_1.registerElement)('Fragment', function () { return new ElementNode_1.default('fragment', _this); });
}
