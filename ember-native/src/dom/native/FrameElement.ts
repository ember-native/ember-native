import { Frame } from '@nativescript/core/ui/frame';
import { isFrame } from '@nativescript/core/ui/frame/frame-helpers';
import type { NavigationTransition, View } from '@nativescript/core';

import { createElement } from '../element-registry.ts';
import ViewNode from '../nodes/ViewNode.ts';
import NativeElementNode from './NativeElementNode.ts';
import { Page } from '@nativescript/core/ui/page';

// PROBE (todo #525 follow-up) - remove before merging.
// Accumulates into a global array (instead of console.log-ing immediately)
// so a single, un-interleaved dump at the very end of the test survives
// karma's live-redrawing progress reporter, which otherwise appears to
// silently drop console.log lines that land mid-redraw.
(globalThis as any).__frameProbeLog = (globalThis as any).__frameProbeLog || [];
function probeLog(label: string, page: Page, frame: Frame) {
  const entries: any[] = (globalThis as any).__frameProbeLog;
  const state = () => ({
    label,
    t: Date.now(),
    isFrameOfPage: isFrame((page as any).frame),
    queueLen: (frame as any)._navigationQueue?.length,
    currentPageId: (frame as any).currentPage?.id,
    thisPageId: (page as any).id,
  });
  entries.push({ ...state(), when: 'sync' });
  for (const delay of [0, 500, 1500, 3000, 6000]) {
    setTimeout(() => entries.push({ ...state(), when: `+${delay}ms` }), delay);
  }
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
      (globalThis as any).__frameProbeLog.push({
        when: 'navigate() start',
        target: childNode.nativeView.id,
        queueLenBefore: (this.nativeView as any)._navigationQueue?.length,
      });
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

    (globalThis as any).__frameProbeLog.push({
      when: 'removeChild',
      target: (childNode as any).nativeView?.id,
      canGoBack: this.nativeView.canGoBack?.(),
    });
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
