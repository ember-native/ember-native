
import { Frame, StackLayout, GridLayout, RootLayout, FlexboxLayout, WrapLayout, DockLayout, AbsoluteLayout, ActionBar, ActionItem, NavigationButton, ActivityIndicator, Button, DatePicker, HtmlView, Image, Label, ListPicker, ListView, Placeholder, Progress, ScrollView, SearchBar, SegmentedBar, Slider, Switch, TabView, TabViewItem, TextField, TextView, TimePicker, FormattedString, Span, WebView, ContentView } from '@nativescript/core';
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
  registerNativeElement('StackLayout', () => StackLayout);
  registerNativeElement('GridLayout', () => GridLayout);
  registerNativeElement('RootLayout', () => RootLayout);
  registerNativeElement('FlexboxLayout', () => FlexboxLayout);
  registerNativeElement('WrapLayout', () => WrapLayout);
  registerNativeElement('DockLayout', () => DockLayout);
  registerNativeElement('AbsoluteLayout', () => AbsoluteLayout);
  registerElement('Frame', () => new FrameElement());
  registerElement('Page', () => new PageElement());
  registerNativeElement('ActionBar', () => ActionBar);
  registerNativeElement('ActionItem', () => ActionItem);
  registerNativeElement('NavigationButton', () => NavigationButton);
  registerNativeElement('ActivityIndicator', () => ActivityIndicator);
  registerNativeElement('Button', () => Button);
  registerNativeElement('DatePicker', () => DatePicker);
  registerNativeElement('HtmlView', () => HtmlView);
  registerNativeElement('Image', () => Image);
  registerNativeElement('Label', () => Label);
  registerNativeElement('ListPicker', () => ListPicker);
  registerNativeElement('ListView', () => ListView);
  registerNativeElement('Comment', () => Placeholder);
  registerNativeElement('Placeholder', () => Placeholder);
  registerNativeElement('Progress', () => Progress);
  registerNativeElement('ScrollView', () => ScrollView);
  registerNativeElement('SearchBar', () => SearchBar);
  registerNativeElement('SegmentedBar', () => SegmentedBar);
  registerNativeElement('Slider', () => Slider);
  registerNativeElement('Switch', () => Switch);
  registerNativeElement('TabView', () => TabView);
  registerNativeElement('TabViewItem', () => TabViewItem);
  registerNativeElement('TextField', () => TextField);
  registerNativeElement('TextView', () => TextView);
  registerNativeElement('TimePicker', () => TimePicker);
  registerNativeElement('FormattedString', () => FormattedString, {
    insertChild(parentNode, childNode, atIndex) {
      const parent = parentNode.nativeView;
      const child = childNode.nativeView;
      parent.spans.splice(atIndex, 0, child);
    }
  });
  registerNativeElement('Span', () => Span);
  registerNativeElement('WebView', () => WebView);
  registerNativeElement('ContentView', () => ContentView);

  // Not Complete
  registerElement('Fragment', () => new NativeElementNode('fragment', null));
}

export { registerElements, registerNativeElement };
//# sourceMappingURL=setup-registry.js.map
