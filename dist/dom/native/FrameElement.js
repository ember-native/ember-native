import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-apNPIsxw.js';
import { Frame } from '@nativescript/core/ui/frame';
import { isAndroid } from '@nativescript/core/platform';
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
 * settled, i.e. its transition has finished animating) before checking
 * again. Re-diffing after every settle, instead of computing a fixed list
 * of steps up front, means it self-heals even if Ember makes several
 * changes before the frame catches up - e.g. a fast forward-then-back
 * collapses to a no-op once the drain finishes.
 *
 * Because a step only completes once its transition finishes animating,
 * more than one native step for a single Ember change (e.g. a route
 * transition that activates several nested routes at once, so more than
 * one new `<page>` appears in the same synchronous batch) would mean
 * several full *animated* transitions playing back to back. `navigateToLeaf`
 * avoids that specific cost on Android by issuing every skipped page's
 * `navigate()` up front with no animation and animating only the last, real
 * destination - see its own doc comment for why this can't apply on iOS.
 * Each skipped page still runs its own real fragment transaction/layout
 * pass via `Frame`'s own internal navigation queue (see its own doc
 * comment), so it can still be visible for a frame or two; what this avoids
 * is each one playing a full, timed transition animation, not fragment
 * construction/layout itself - no perf measurement backs a stronger claim
 * than that.
 *
 * An earlier version of this instead issued a single real `navigate()` to
 * the leaf and spliced synthetic, fragment-less `BackstackEntry` objects
 * for the skipped pages directly into `Frame`'s private `_backStack` -
 * cheaper, but those synthetic entries never went through
 * `_setAndroidFragmentTransitions`, so they had no enter/exit/reenter/
 * return transition listeners of their own. `goBack()`-ing onto one left
 * NativeScript's Android transition bookkeeping
 * (`fragment.transitions.android.js`'s `waitingQueue`, keyed by
 * `entry.frameId` and expecting a matched pair of listeners per step) with
 * only one side ever registering, permanently corrupting it for every
 * navigation on that frame afterward. Every page this class now creates
 * goes through a real `navigate()`, so every backstack entry gets the same
 * paired listener setup as any other - that whole bug class no longer has
 * anywhere to live.
 */
class FrameElement extends NativeElementNode {
  constructor() {
    super('frame', Frame, null);
    _defineProperty(this, "reconcileScheduled", false);
    _defineProperty(this, "reconciling", false);
    _defineProperty(this, "pendingTransition", null);
    // How many still-queued `navigate()` calls a single `reconcile()` step
    // issued (see `navigateToLeaf`) - `Frame`'s own internal navigation queue
    // fires `navigatedToEvent` once per settled call, but only the *last* one
    // in a batch means the frame has actually caught up with `childNodes`;
    // earlier ones just let `Frame` know it's free to start the next queued
    // call, decremented rather than acted on.
    //
    // This relies on every queued `navigate()` eventually firing its own
    // `navigatedToEvent` exactly once - if any of them were ever silently
    // dropped (e.g. by `_processNavigationQueue`'s `page !== currentNavigationPage`
    // identity check skipping it), this count would never reach 1 again and
    // `reconciling` would stay stuck `true` forever, the same permanent freeze
    // this whole mechanism replaced (see the class doc comment). Not otherwise
    // guarded against here - no case where a page created and queued by this
    // class's own `navigate()` calls fails to settle has been observed.
    _defineProperty(this, "pendingSettleCount", 1);
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
      if (this.pendingSettleCount > 1) {
        this.pendingSettleCount--;
        return;
      }
      this.pendingSettleCount = 1;
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
        // Cross-tree jump straight into a nested route (`desired.length > 1`).
        this.navigateToLeaf(desired, 0, true, transition);
      } else {
        this.pendingSettleCount = 1;
        this.nativeView.goBack(backStack[i - 1]);
      }
      return;
    }

    // Everything the frame currently shows is still wanted - push forward
    // to the next desired page(s).
    this.navigateToLeaf(desired, i, false, transition);
  }

  /**
   * Navigates from wherever the frame currently is to
   * `desired[desired.length - 1]`, even when that skips over one or more
   * pages in `desired.slice(fromIndex)` that never got their own transition
   * - e.g. a cross-tree jump straight into a nested route (`fromIndex === 0`
   * with `clearHistory: true`), or an Ember transition that activates
   * several nested routes deeper than the currently-active one in one go
   * (`fromIndex > 0` with `clearHistory: false`).
   *
   * On Android, every skipped page still gets a real `navigate()` call -
   * each one is queued (via `Frame`'s own internal `_navigationQueue`,
   * simply by calling `navigate()` again before the previous one has
   * settled) with no animation, so none of them plays a full timed
   * transition; only the last, real destination animates. Each one still
   * runs its own real fragment transaction/layout pass and can be visible
   * for a frame or two while queued ones resolve - what this avoids is N
   * full animated transitions playing back to back, not the underlying
   * native work itself. This keeps every backstack entry a genuine one (its
   * own fragment, its own paired transition listeners), just as if
   * `reconcile()` had stepped through them one settle at a time - avoiding
   * the synthetic, listener-less backstack entries an earlier version of
   * this spliced in directly, which could desync `Frame`'s own transition
   * bookkeeping and permanently freeze the frame (see the class doc
   * comment).
   *
   * Only on Android: iOS's `popToViewControllerAnimated` can only pop to a
   * view controller that was actually pushed, so queuing several
   * unanimated pushes ahead of time doesn't help there the way it does on
   * Android - iOS keeps stepping through each intermediate page with its
   * own animated transition instead, via `reconcile()`'s normal
   * one-step-at-a-time loop (this method navigates to just
   * `desired[fromIndex]` there).
   */
  navigateToLeaf(desired, fromIndex, clearHistory, transition) {
    const pages = isAndroid ? desired.slice(fromIndex) : [desired[fromIndex]];
    this.pendingSettleCount = pages.length;
    pages.forEach((page, index) => {
      const isLeaf = index === pages.length - 1;
      this.nativeView.navigate({
        create: () => page,
        clearHistory: clearHistory && index === 0,
        backstackVisible: true,
        transition: isLeaf ? transition?.transition || {} : {},
        animated: isLeaf ? transition?.animated : false
      });
    });
  }
}

export { FrameElement as default, setNextTransition, setOnUnexpectedBack };
//# sourceMappingURL=FrameElement.js.map
