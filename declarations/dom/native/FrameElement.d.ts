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
 * settled) before checking again. Re-diffing after every settle, instead
 * of computing a fixed list of steps up front, means it self-heals even if
 * Ember makes several changes before the frame catches up - e.g. a fast
 * forward-then-back collapses to a no-op once the drain finishes.
 */
export default class FrameElement extends NativeElementNode {
    private reconcileScheduled;
    private reconciling;
    private pendingTransition;
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
}
