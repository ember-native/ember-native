import { Frame } from '@nativescript/core/ui/frame';
import { isFrame } from '@nativescript/core/ui/frame/frame-helpers';
import type { NavigationTransition, View } from '@nativescript/core';

import { createElement } from '../element-registry.ts';
import ViewNode from '../nodes/ViewNode.ts';
import NativeElementNode from './NativeElementNode.ts';
import { Page } from '@nativescript/core/ui/page';

// PROBE (todo #525 follow-up) - remove before merging.
function probeLog(label: string, page: Page, frame: Frame) {
  const state = () =>
    JSON.stringify({
      isFrameOfPage: isFrame((page as any).frame),
      queueLen: (frame as any)._navigationQueue?.length,
      currentPageId: (frame as any).currentPage?._domId,
      thisPageId: (page as any)._domId,
    });
  console.log(`[frame-probe] ${label} sync`, state());
  setTimeout(() => console.log(`[frame-probe] ${label} +0ms`, state()), 0);
  setTimeout(() => console.log(`[frame-probe] ${label} +500ms`, state()), 500);
  setTimeout(
    () => console.log(`[frame-probe] ${label} +1500ms`, state()),
    1500,
  );
}

let nextTransition: {
  transition: NavigationTransition | undefined;
  animated: boolean | undefined;
} | null = null;
export function setNextTransition(
  transition?: NavigationTransition,
  animated = true,
) {
  nextTransition = { transition, animated };
}

export default class FrameElement extends NativeElementNode {
  currentPage: any;

  constructor() {
    super('frame', Frame, null);
  }

  setAttribute(key: string, value: any) {
    if (key.toLowerCase() == 'defaultpage') {
      const dummy = createElement('fragment');
      (this.nativeView).navigate({
        create: () =>
          (dummy.firstElement() as NativeElementNode).nativeView as View,
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
    if (
      childNode instanceof NativeElementNode &&
      childNode.nativeView instanceof Page
    ) {
      this.currentPage = childNode.nativeView;
      this.nativeView.navigate({
        create: () => childNode.nativeView,
        clearHistory: true,
        backstackVisible: false,
        transition: nextTransition?.transition || {},
        animated: nextTransition?.animated,
      });
      nextTransition = null;
    }
    super.appendChild(childNode);
    return;
  }

  onInsertedChild(childNode: ViewNode) {
    if (
      childNode instanceof NativeElementNode &&
      childNode.nativeView instanceof Page &&
      this.currentPage !== childNode.nativeView
    ) {
      this.currentPage = childNode.nativeView;
      console.log(
        '[frame-probe] onInsertedChild navigate() start, queueLen before=',
        (this.nativeView as any)._navigationQueue?.length,
      );
      this.nativeView.navigate({
        create: () => childNode.nativeView,
        // PROBE: backstack-preserving instead of clearHistory:true, to see
        // whether a second navigate() queued shortly after the first stalls
        // when history isn't being cleared.
        clearHistory: false,
        backstackVisible: true,
        transition: nextTransition?.transition || {},
        animated: nextTransition?.animated,
      });
      nextTransition = null;
      probeLog('onInsertedChild->' + childNode.nativeView.id, childNode.nativeView as Page, this.nativeView);
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

    console.log(
      '[frame-probe] removeChild',
      (childNode as any).nativeView?.id,
      'backstack before goBack, canGoBack=',
      this.nativeView.canGoBack?.(),
    );
    // PROBE: if the removed node is the frame's current page and it can go
    // back, drive the frame's own backstack instead of leaving it stuck.
    if (
      childNode.nativeView === this.currentPage &&
      this.nativeView.canGoBack?.()
    ) {
      this.nativeView.goBack();
      probeLog('afterGoBack', this.currentPage as Page, this.nativeView);
    }

    childNode.parentNode = null;

    this.childNodes = this.childNodes.filter((node) => node !== childNode);
    childNode.removeChildren();
    this.onRemovedChild(childNode);
  }
}
