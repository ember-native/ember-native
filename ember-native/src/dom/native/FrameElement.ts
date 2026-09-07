import { Frame } from '@nativescript/core/ui/frame';
import type { NavigationTransition, View } from '@nativescript/core';
import { isAndroid } from '@nativescript/core/platform';
import type { BackstackEntry } from '@nativescript/core/ui/frame/frame-interfaces';

import { createElement } from '../element-registry.ts';
import ViewNode from '../nodes/ViewNode.ts';
import NativeElementNode from './NativeElementNode.ts';
import { Page } from '@nativescript/core/ui/page';

let syntheticBackstackTagCounter = 0;

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

// Called whenever the frame's `currentPage` moves back a step *without*
// this element's own `reconcile()` having driven it - i.e. a real native UI
// gesture, not Ember, popped the frame (iOS's edge swipe-back gesture is
// the only one enabled today - see `PageElement`). `FrameElement` has no
// routing knowledge of its own, so it can't resync Ember's router itself;
// a routing-aware layer (`HistoryService`) sets this to its own `back()` so
// the router ends up wherever the now-visible page actually belongs.
let onUnexpectedBack: (() => void) | null = null;
export function setOnUnexpectedBack(handler: (() => void) | null) {
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
export default class FrameElement extends NativeElementNode {
  private reconcileScheduled = false;
  private reconciling = false;
  private pendingTransition: typeof nextTransition = null;
  // Set right before a cross-tree jump's single `navigate()` call settles -
  // see the `i === 0` branch in `reconcile()` and `seedBackstack()` below.
  // Holds the ancestor pages (outermost first) that still need a real
  // backstack entry even though they never got their own transition.
  private pendingBackstackSeed: Page[] | null = null;

  constructor() {
    super('frame', Frame, null);
    this.nativeView.on(Page.navigatedToEvent, (args: any) => {
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
      if (this.pendingBackstackSeed) {
        this.seedBackstack(this.pendingBackstackSeed);
        this.pendingBackstackSeed = null;
      }
      this.reconcile();
    });
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

  get currentPage(): Page | undefined {
    return this.nativeView.currentPage;
  }

  private get desiredPages(): Page[] {
    return this.childNodes
      .filter(
        (node): node is NativeElementNode =>
          node instanceof NativeElementNode &&
          node.nativeView instanceof Page,
      )
      .map((node) => node.nativeView as Page);
  }

  //In regular native script, Frame elements aren't meant to have children, we instead allow it to have several.. pages..
  // as a convenience, and drive a real backstack from them - see the class doc comment above.
  onInsertedChild(childNode: ViewNode) {
    if (
      childNode instanceof NativeElementNode &&
      childNode.nativeView instanceof Page
    ) {
      this.scheduleReconcile();
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

    const wasPage = childNode.nativeView instanceof Page;

    childNode.parentNode = null;

    this.childNodes = this.childNodes.filter((node) => node !== childNode);
    childNode.removeChildren();
    this.onRemovedChild(childNode);

    if (wasPage) {
      this.scheduleReconcile();
    }
  }

  private scheduleReconcile() {
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

  private reconcile() {
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
    const actual = current
      ? [...backStack.map((entry) => entry.resolvedPage), current]
      : [];

    let i = 0;
    while (
      i < desired.length &&
      i < actual.length &&
      desired[i] === actual[i]
    ) {
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
        // Cross-tree jump straight into a nested route (`desired.length > 1`):
        // on Android, do a single native transition straight to the true
        // leaf and splice synthetic `BackstackEntry` objects for the
        // intermediate ancestors into the backstack once it settles (see
        // `seedBackstack`), instead of materializing each ancestor with its
        // own transition first. iOS's `popToViewControllerAnimated` can only
        // pop to a view controller that was actually pushed, so a synthetic
        // entry there would be an unreachable `goBack()`/edge-swipe target -
        // iOS keeps stepping through each ancestor instead.
        const seedAncestors = isAndroid && desired.length > 1;
        if (seedAncestors) {
          this.pendingBackstackSeed = desired.slice(0, -1);
        }
        const leaf = seedAncestors ? desired[desired.length - 1]! : desired[0]!;
        this.nativeView.navigate({
          create: () => leaf,
          clearHistory: true,
          backstackVisible: true,
          transition: transition?.transition || {},
          animated: transition?.animated,
        });
      } else {
        this.nativeView.goBack(backStack[i - 1]);
      }
      return;
    }

    // Everything the frame currently shows is still wanted - push the next
    // desired page on top.
    this.nativeView.navigate({
      create: () => desired[i]!,
      clearHistory: false,
      backstackVisible: true,
      transition: transition?.transition || {},
      animated: transition?.animated,
    });
  }

  /**
   * Splices real `BackstackEntry` objects for `ancestors` (outermost first)
   * into the frame's backstack, below the page it just navigated to,
   * without running their own `navigate()`/transition/`navigatedTo` cycle.
   *
   * Must only run once the triggering `navigate({ clearHistory: true, ... })`
   * has fully settled - `_updateBackstack`'s `clearHistory` handling tears
   * down (`resolvedPage = null`) every entry it finds in the backstack at
   * that point, so splicing any earlier would just have those entries
   * destroyed again.
   *
   * A `BackstackEntry` with no `fragment` is already a real, tolerated
   * `goBack()` target on Android - `Frame._goBackCore` lazily creates the
   * fragment on demand (the same path used to recreate fragments the OS
   * discarded after activity destruction), committing it through a normal
   * fragment transaction. `fragmentTag` only needs to be unique per frame
   * (it's how a recreated native fragment re-associates with its JS
   * backstack entry), and `navDepth` only affects later fragment tags'
   * cosmetic suffix, not correctness.
   */
  private seedBackstack(ancestors: Page[]) {
    const backStack = (
      this.nativeView as unknown as { _backStack: BackstackEntry[] }
    )._backStack;
    ancestors.forEach((page, index) => {
      backStack.push({
        entry: { create: () => page, backstackVisible: true },
        resolvedPage: page,
        navDepth: index,
        fragmentTag: `ember-native-seeded-${syntheticBackstackTagCounter++}`,
      });
    });
  }
}
