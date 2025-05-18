// Largely taken from the Vue implimentation
import {
  View,
  AbsoluteLayout,
  ActionBar,
  ActionItem,
  NavigationButton,
  ActivityIndicator,
  Placeholder,
  Button,
  DatePicker,
  FlexboxLayout,
  DockLayout,
  FormattedString,
  Span,
  GridLayout,
  HtmlView,
  Label,
  ListPicker,
  StackLayout,
  ScrollView,
  Switch,
  TabView,
  TabViewItem,
  TextField,
  TextView,
  WebView,
  WrapLayout,
  ContentView,
  ListView,
  Image,
  Frame,
  RootLayout,
  Progress,
  SearchBar,
  SegmentedBar,
  Slider,
  TimePicker,
} from '@nativescript/core';

import { registerElement } from './element-registry.ts';
import FrameElement from './native/FrameElement.ts';
import NativeElementNode, {
  type ComponentMeta,
} from './native/NativeElementNode.ts';
import PageElement from './native/PageElement.ts';

export function registerNativeElement(
  elementName: string,
  resolver: () => typeof View,
  meta: ComponentMeta | null = null,
) {
  registerElement(
    elementName,
    () => new NativeElementNode(elementName, resolver(), meta),
  );
}

export function registerElements() {
  registerElement('head', () => null as any, {
    insertChild() {},
  });
  registerElement('style', () => new NativeElementNode('style', null));
  registerElement('div', () => Frame as any, {
    insertChild(parentNode: any, childNode: any, _atIndex: any) {
      //dont bother
      parentNode.appendChild(childNode);
    },
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
  registerNativeElement('ActionItem', () => ActionItem as any);
  registerNativeElement('NavigationButton', () => NavigationButton as any);
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
  registerNativeElement('TabViewItem', () => TabViewItem as any);
  registerNativeElement('TextField', () => TextField);
  registerNativeElement('TextView', () => TextView);
  registerNativeElement('TimePicker', () => TimePicker);
  registerNativeElement('FormattedString', () => FormattedString as any, {
    insertChild(
      parentNode: NativeElementNode<FormattedString>,
      childNode: NativeElementNode<Span>,
      atIndex,
    ) {
      const parent = parentNode.nativeView;
      const child = childNode.nativeView;
      parent.spans.splice(atIndex, 0, child);
    },
  });
  registerNativeElement('Span', () => Span as any);
  registerNativeElement('WebView', () => WebView);
  registerNativeElement('ContentView', () => ContentView);

  // Not Complete
  registerElement('Fragment', () => new NativeElementNode('fragment', null));
}
