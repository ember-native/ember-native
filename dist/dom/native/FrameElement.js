import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-apNPIsxw.js';
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

// Called whenever the frame's `currentPage` moves back a step *without*
// this element's own `reconcile()` having driven it - i.e. a real native UI
// gesture, not Ember, popped the frame (iOS's edge swipe-back gesture is
// the only one enabled today - see `PageElement`). `FrameElement` has no
// routing knowledge of its own, so it can't resync Ember's router itself;
// a routing-aware layer (`HistoryService`) sets this to its own `back()` so
// the router ends up wherever the now-visible page actually belongs.
let onUnexpectedBack = null;
function setOnUnexpectedBack(handler) {
  onUnexpectedBack = handler;
}

/**
 * Drives a real `Frame` backstack from the `<page>` elements Ember mounts as
 * this element's children, instead of keeping every route's page mounted
 * side by side and faking "back" with a `visibility` toggle.
 *
 * Ember's own outlet lifecycle already keeps a parent route's `<page>`
 * mounted while a child route is active, and nested routes render their
 * pages as *siblings* under the same `<frame>` in route-depth order (see
 * `FrameOutlet`) - so `childNodes` filtered to `Page` instances, in DOM
 * order, is exactly the page stack Ember wants visible: index 0 is the
 * outermost active route, the last entry is the innermost.
 *
 * Ember's render timeline and `Frame`'s navigation timeline can't be
 * merged: `navigate()`/`goBack()` are asynchronous and internally queued (a
 * call can sit for hundreds of ms before `currentPage`/`backStack` reflect
 * it), while Ember can insert and remove a `<page>` node in the same
 * synchronous batch. Calling `navigate()`/`goBack()` directly from
 * `onInsertedChild`/`removeChild` races that gap - a route can transition
 * away before its forward `navigate()` has even started, `canGoBack()`
 * still reads `false` at that point, and a naive `goBack()` silently
 * no-ops, leaving the frame out of sync with Ember's routes.
 *
 * So insert/remove never touch the native frame directly - they only
 * update `childNodes` (recording *intent*) and schedule `reconcile()`,
 * which compares the desired stack to the frame's actual one (`backStack`
 * + `currentPage` - deliberately not `canGoBack()`, which is *predictive*:
 * it looks ahead into the frame's own pending navigation queue and reports
 * what the backstack *will* be once queued operations settle, so it can
 * already read `false` the instant a `goBack()` is merely *queued*, before
 * it's actually done) and performs exactly one native step - either
 * `navigate()` or `goBack()` - then waits for the frame's own
 * `navigatedTo` event (which only fires once a queued navigation has truly
 * settled) before checking again. Re-diffing after every settle, instead
 * of computing a fixed list of steps up front, means it self-heals even if
 * Ember makes several changes before the frame catches up - e.g. a fast
 * forward-then-back collapses to a no-op once the drain finishes.
 */
class FrameElement extends NativeElementNode {
  constructor() {
    super('frame', Frame, null);
    _defineProperty(this, "reconcileScheduled", false);
    _defineProperty(this, "reconciling", false);
    _defineProperty(this, "pendingTransition", null);
    this.nativeView.on(Page.navigatedToEvent, args => {
      if (!this.reconciling) {
        // Not a step we issued - a native UI gesture (iOS's edge swipe-back
        // is the only one enabled today) drove this instead. Nothing for
        // *us* to drain (`childNodes` hasn't changed), but a routing-aware
        // layer needs to catch up to it - see `setOnUnexpectedBack` above.
        if (args?.isBack) {
          onUnexpectedBack?.();
        }
        return;
      }
      this.reconciling = false;
      this.reconcile();
    });
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
  get currentPage() {
    return this.nativeView.currentPage;
  }
  get desiredPages() {
    return this.childNodes.filter(node => node instanceof NativeElementNode && node.nativeView instanceof Page).map(node => node.nativeView);
  }

  //In regular native script, Frame elements aren't meant to have children, we instead allow it to have several.. pages..
  // as a convenience, and drive a real backstack from them - see the class doc comment above.
  onInsertedChild(childNode) {
    if (childNode instanceof NativeElementNode && childNode.nativeView instanceof Page) {
      this.scheduleReconcile();
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
    const wasPage = childNode.nativeView instanceof Page;
    childNode.parentNode = null;
    this.childNodes = this.childNodes.filter(node => node !== childNode);
    childNode.removeChildren();
    this.onRemovedChild(childNode);
    if (wasPage) {
      this.scheduleReconcile();
    }
  }
  scheduleReconcile() {
    // Snapshot whatever transition `NativeRouter`/`HistoryService` staged
    // for the route change in progress *now*, synchronously - by the time
    // `reconcile()` actually runs (a microtask away, or later still if a
    // native navigation is already in flight), an unrelated, later route
    // change could already have called `setNextTransition()` again and
    // overwritten the module-level value.
    if (!this.reconcileScheduled) {
      this.pendingTransition = nextTransition;
      nextTransition = null;
    }
    if (this.reconcileScheduled || this.reconciling) {
      return;
    }
    this.reconcileScheduled = true;
    queueMicrotask(() => {
      this.reconcileScheduled = false;
      this.reconcile();
    });
  }
  reconcile() {
    if (this.reconciling) {
      // A native navigate()/goBack() is already in flight - its own
      // `navigatedTo` settle handler (see the constructor) will call
      // reconcile() again once it resolves.
      return;
    }
    const desired = this.desiredPages;
    if (desired.length === 0) {
      // Nothing sensible to navigate to (e.g. mid-teardown) - leave the
      // frame as-is.
      return;
    }
    const backStack = this.nativeView.backStack;
    const current = this.nativeView.currentPage;
    const actual = current ? [...backStack.map(entry => entry.resolvedPage), current] : [];
    let i = 0;
    while (i < desired.length && i < actual.length && desired[i] === actual[i]) {
      i++;
    }

    // Read-and-clear unconditionally, in sync or not: this reconcile() call
    // is the only thing whatever route change staged `pendingTransition`
    // was meant for. Left set on a no-op (e.g. resyncing after an
    // unexpected native back - see `setOnUnexpectedBack` - never has a
    // native step to apply it to), it would otherwise leak into whichever
    // later, unrelated step happens to run next via the settle handler
    // (which reads it without going through `scheduleReconcile()`'s own
    // capture).
    const transition = this.pendingTransition;
    this.pendingTransition = null;
    if (i === desired.length && i === actual.length) {
      // Already in sync.
      return;
    }
    this.reconciling = true;
    if (i < actual.length) {
      // The frame is showing (or has backstacked) pages beyond what's
      // desired now - step back toward the common prefix. `i === 0` means
      // even the bottom page differs (e.g. the app jumped to an unrelated
      // top-level route in one go) - there's nothing to go back *to* in
      // that case, so replace the stack's base outright instead.
      if (i === 0) {
        this.nativeView.navigate({
          create: () => desired[0],
          clearHistory: true,
          backstackVisible: true,
          transition: transition?.transition || {},
          animated: transition?.animated
        });
      } else {
        this.nativeView.goBack(backStack[i - 1]);
      }
      return;
    }

    // Everything the frame currently shows is still wanted - push the next
    // desired page on top.
    this.nativeView.navigate({
      create: () => desired[i],
      clearHistory: false,
      backstackVisible: true,
      transition: transition?.transition || {},
      animated: transition?.animated
    });
  }
}

export { FrameElement as default, setNextTransition, setOnUnexpectedBack };
//# sourceMappingURL=FrameElement.js.map
