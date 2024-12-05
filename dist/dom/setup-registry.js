import { Frame, FormattedString, AbsoluteLayout, ActionBar, ActionItem, ActivityIndicator, Placeholder, Button, DatePicker, DockLayout, FlexboxLayout, GridLayout, HtmlView, Image, Label, ListPicker, NavigationButton, Span, StackLayout, ScrollView, Switch, TabView, TabViewItem, TextField, TextView, WebView, WrapLayout, ContentView, ListView } from '@nativescript/core';
import { registerElement } from './element-registry.js';
import FrameElement from './native/FrameElement.js';
import NativeElementNode from './native/NativeElementNode.js';
import PageElement from './native/PageElement.js';

// Largely taken from the Vue implimentation
function registerNativeElement(elementName, resolver, meta = null) {
  registerElement(elementName, () => new NativeElementNode(elementName, resolver(), meta));
}
function registerElements() {
  registerElement('head', () => null, {
    insertChild() {}
  });
  registerElement('style', () => new NativeElementNode('style', null));
  registerElement('div', () => Frame, {
    insertChild(parentNode, childNode, _atIndex) {
      //dont bother
      parentNode.appendChild(childNode);
    }
  });
  // Completed
  registerNativeElement('AbsoluteLayout', () => AbsoluteLayout);
  registerNativeElement('ActionBar', () => ActionBar);
  registerNativeElement('ActionItem', () => ActionItem);
  registerNativeElement('ActivityIndicator', () => ActivityIndicator);
  registerNativeElement('Comment', () => Placeholder);
  registerNativeElement('Button', () => Button);
  registerNativeElement('DatePicker', () => DatePicker);
  registerNativeElement('DockLayout', () => DockLayout);
  registerNativeElement('FlexboxLayout', () => FlexboxLayout);
  registerNativeElement('FormattedString', () => FormattedString, {
    insertChild(parentNode, childNode, atIndex) {
      const parent = parentNode.nativeView;
      const child = childNode.nativeView;
      parent.spans.splice(atIndex, 0, child);
    }
  });
  registerNativeElement('GridLayout', () => GridLayout);
  registerNativeElement('HtmlView', () => HtmlView);
  registerNativeElement('Image', () => Image);
  registerNativeElement('Label', () => Label);
  registerNativeElement('ListPicker', () => ListPicker);
  registerNativeElement('NavigationButton', () => NavigationButton);
  // registerNativeElement('Page', () => require('@nativescript/core/ui/page').Page);
  registerNativeElement('Span', () => Span);
  registerNativeElement('StackLayout', () => StackLayout);
  registerNativeElement('ScrollView', () => ScrollView);
  registerNativeElement('Switch', () => Switch);
  registerNativeElement('TabView', () => TabView);
  registerNativeElement('TabViewItem', () => TabViewItem);
  registerNativeElement('TextField', () => TextField);
  registerNativeElement('TextView', () => TextView);
  registerNativeElement('WebView', () => WebView);
  registerNativeElement('WrapLayout', () => WrapLayout);
  registerNativeElement('ContentView', () => ContentView);
  registerNativeElement('ListView', () => ListView);

  // Not Complete
  registerElement('Frame', () => new FrameElement());
  registerElement('Page', () => new PageElement());
  registerElement('Fragment', () => new NativeElementNode('fragment', null));
}

export { registerElements, registerNativeElement };
//# sourceMappingURL=setup-registry.js.map
