
import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-ClPBvGFm.js';
import { Frame } from '@nativescript/core/ui/frame';
import { createElement } from '../element-registry.js';
import NativeElementNode from './NativeElementNode.js';
import { Page } from '@nativescript/core/ui/page';

let nextTransition = null;
function setNextTransition(transition, animated = true) {
  nextTransition = {
    transition,
    animated
  };
}
class FrameElement extends NativeElementNode {
  constructor() {
    super('frame', Frame, null);
    _defineProperty(this, "currentPage", void 0);
  }
  setAttribute(key, value) {
    if (key.toLowerCase() == 'defaultpage') {
      const dummy = createElement('fragment');
      this.nativeView.navigate({
        create: () => dummy.firstElement().nativeView
      });
    }
    super.setAttribute(key, value);
  }
  get nativeView() {
    return super.nativeView;
  }
  set nativeView(view) {
    super.nativeView = view;
  }

  //In regular native script, Frame elements aren't meant to have children, we instead allow it to have one.. a page.. as a convenience
  // and set the instance as the default page by navigating to it.
  appendChild(childNode) {
    //only handle page nodes
    if (childNode instanceof NativeElementNode && childNode.nativeView instanceof Page) {
      this.currentPage = childNode.nativeView;
      this.nativeView.navigate({
        create: () => childNode.nativeView,
        clearHistory: true,
        backstackVisible: false,
        transition: nextTransition?.transition || {},
        animated: nextTransition?.animated
      });
      nextTransition = null;
    }
    super.appendChild(childNode);
    return;
  }
  onInsertedChild(childNode) {
    if (childNode instanceof NativeElementNode && childNode.nativeView instanceof Page && this.currentPage !== childNode.nativeView) {
      this.nativeView.navigate({
        create: () => childNode.nativeView,
        clearHistory: true,
        backstackVisible: false,
        transition: nextTransition?.transition || {},
        animated: nextTransition?.animated
      });
      nextTransition = null;
    }
  }
  removeChild(childNode) {
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
    this.childNodes = this.childNodes.filter(node => node !== childNode);
    childNode.removeChildren();
    this.onRemovedChild(childNode);
  }
}

export { FrameElement as default, setNextTransition };
//# sourceMappingURL=FrameElement.js.map
