import { Frame } from '@nativescript/core/ui/frame';

import { createElement } from '../element-registry.ts';
import ViewNode from '../nodes/ViewNode';
import NativeElementNode from './NativeElementNode';
import { Page } from '@nativescript/core/ui/page';

export default class FrameElement extends NativeElementNode {
  currentPage: any;

  constructor() {
    super('frame', Frame, null);
  }

  setAttribute(key: string, value: any) {
    if (key.toLowerCase() == 'defaultpage') {
      let dummy = createElement('fragment');
      (this.nativeView as Frame).navigate({
        create: () => (dummy.firstElement() as NativeElementNode).nativeView
      });
    }
    super.setAttribute(key, value);
  }

  get nativeView(): Frame {
    return super.nativeView as Frame;
  }

  set nativeView(view: Frame) {
    super.nativeView = view;
  }

  //In regular native script, Frame elements aren't meant to have children, we instead allow it to have one.. a page.. as a convenience
  // and set the instance as the default page by navigating to it.
  appendChild(childNode: ViewNode) {
    //only handle page nodes
    console.log('appendChild', childNode);
    if (childNode.nativeView instanceof Page) {
      console.log('navigate', childNode);
      this.currentPage = childNode.nativeView;
      this.nativeView.navigate({
        create: () => childNode.nativeView,
        clearHistory: true,
        backstackVisible: false,
        transition: {

        }
      });
    }
    super.appendChild(childNode);
    return;
  }

  onInsertedChild(childNode: ViewNode) {
    if (childNode.nativeView instanceof Page && this.currentPage !== childNode.nativeView) {
      console.log('navigate', childNode);
      this.nativeView.navigate({
        create: () => childNode.nativeView,
        clearHistory: true,
        backstackVisible: false,
        transition: {

        }
      });
    }
  }

  removeChild(childNode: NativeElementNode) {
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

    this.childNodes = this.childNodes.filter((node) => node !== childNode);
    childNode.removeChildren();
    this.onRemovedChild(childNode);
  }
}
