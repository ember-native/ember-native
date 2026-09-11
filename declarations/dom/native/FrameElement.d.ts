import { Frame } from '@nativescript/core/ui/frame';
import type { NavigationTransition } from '@nativescript/core';
import ViewNode from '../nodes/ViewNode.ts';
import NativeElementNode from './NativeElementNode.ts';
import { Page } from '@nativescript/core/ui/page';
export declare function setNextTransition(transition?: NavigationTransition, animated?: boolean): void;
export declare function setOnUnexpectedBack(handler: (() => void) | null): void;
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
export default class FrameElement extends NativeElementNode {
    private reconcileScheduled;
    private reconciling;
    private pendingTransition;
    private pendingSettleCount;
    constructor();
    setAttribute(key: string, value: any): void;
    get nativeView(): Frame;
    set nativeView(view: Frame);
    get currentPage(): Page | undefined;
    private get desiredPages();
    onInsertedChild(childNode: ViewNode): void;
    removeChild(childNode: NativeElementNode): void;
    private scheduleReconcile;
    private reconcile;
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
    private navigateToLeaf;
}
