// Largely taken from the Vue implimentation
import {
  View,
  AbsoluteLayout,
  ActionBar, ActionItem, NavigationButton,
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
  Frame
} from '@nativescript/core';

import { registerElement } from './element-registry.ts';
import FrameElement from './native/FrameElement.ts';
import NativeElementNode, {
  type ComponentMeta,
} from './native/NativeElementNode.ts';
import PageElement from './native/PageElement.ts';
import {RadListView} from "nativescript-ui-listview";

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
    insertChild() {
    }
  });
  registerElement('style', () => new NativeElementNode('style', null));
  registerElement('div', () => Frame as any, {
    insertChild(parentNode: any, childNode: any, atIndex: any) {
      //dont bother
      parentNode.appendChild(childNode);
    }
  });
  // Completed
  registerNativeElement(
    'AbsoluteLayout',
    () =>
      AbsoluteLayout,
  );
  registerNativeElement(
    'ActionBar',
    () => ActionBar,
  );
  registerNativeElement(
    'ActionItem',
    () => ActionItem as any,
  );
  registerNativeElement(
    'ActivityIndicator',
    () => ActivityIndicator,
  );

  registerNativeElement(
    'Comment',
    () => Placeholder,
  );
  registerNativeElement(
    'Button',
    () => Button,
  );
  registerNativeElement(
    'DatePicker',
    () => DatePicker,
  );
  registerNativeElement(
    'DockLayout',
    () => DockLayout,
  );
  registerNativeElement(
    'FlexboxLayout',
    () => FlexboxLayout,
  );
  registerNativeElement(
    'FormattedString',
    () => FormattedString as any,
    {
      insertChild(
        parentNode: NativeElementNode<FormattedString>,
        childNode: NativeElementNode<Span>,
        atIndex,
      ) {
        const parent = parentNode.nativeView;
        const child = childNode.nativeView;
        parent.spans.splice(atIndex, 0, child);
      },
    },
  );
  registerNativeElement(
    'GridLayout',
    () => GridLayout,
  );
  registerNativeElement(
    'HtmlView',
    () => HtmlView,
  );
  registerNativeElement(
    'Image',
    () => Image,
  );
  registerNativeElement(
    'Label',
    () => Label,
  );
  registerNativeElement(
    'ListPicker',
    () => ListPicker,
  );
  registerNativeElement(
    'NavigationButton',
    () => NavigationButton as any,
  );
  // registerNativeElement('Page', () => require('@nativescript/core/ui/page').Page);
  registerNativeElement(
    'Span',
    () => Span as any,
  );
  registerNativeElement(
    'StackLayout',
    () => StackLayout,
  );
  registerNativeElement(
    'ScrollView',
    () => ScrollView,
  );
  registerNativeElement(
    'Switch',
    () => Switch,
  );
  registerNativeElement(
    'TabView',
    () => TabView,
  );
  registerNativeElement(
    'TabViewItem',
    () => TabViewItem as any,
  );
  registerNativeElement(
    'TextField',
    () => TextField,
  );
  registerNativeElement(
    'TextView',
    () => TextView,
  );
  registerNativeElement(
    'WebView',
    () => WebView,
  );
  registerNativeElement(
    'WrapLayout',
    () => WrapLayout,
  );
  registerNativeElement(
    'ContentView',
    () => ContentView,
  );
  registerNativeElement(
    'ListView',
    () => ListView,
  );
  registerNativeElement(
    'RadListView',
    () => RadListView,
  );

  // Not Complete
  registerElement('Frame', () => new FrameElement());
  registerElement('Page', () => new PageElement());
  registerElement('Fragment', () => new NativeElementNode('fragment', null));
}
