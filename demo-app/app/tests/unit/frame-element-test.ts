import { setupRenderingTest } from '~/tests/helpers';
import { createElement } from 'ember-native/dom/element-registry';

// Regression coverage for FrameElement.onInsertedChild not tracking
// `currentPage` (only `appendChild` did, pre-fix) - see
// ember-native/src/dom/native/FrameElement.ts. This reproduces the exact
// "navigate away and back" sequence PageStackOutlet needs (a route's <page>
// component instance is kept alive and reinserted, rather than destroyed and
// recreated), which is also the case that most directly exposed the bug:
// without the fix, re-inserting the very first page after a second page had
// been shown left the frame silently stuck showing the second page, because
// `currentPage` still pointed at the first page's own nativeView and the
// `this.currentPage !== childNode.nativeView` guard in `onInsertedChild`
// incorrectly compared equal.
//
// A real route transition inserts new content via `insertBefore` (with the
// outgoing page still present as `referenceNode`) before removing the old
// page - which is exactly what routes `onInsertedChild` through, as opposed
// to `appendChild`'s own inline navigate() call (only exercised for the very
// first page ever mounted into a frame). `nativeView.navigate` is stubbed
// here rather than awaited for real, since the real native transition is an
// async, Android-animation-driven attach (confirmed via on-device
// instrumentation - see .pjp-runner/todo.md's todo #525 write-up) that isn't
// needed to prove this fix: what's under test is FrameElement's own
// decision of *whether* and *with what* to call `navigate()`, not whether
// NativeScript's native frame finishes attaching it.
QUnit.module('FrameElement | Frame.navigate() wiring', function (hooks) {
  setupRenderingTest(hooks);

  QUnit.test('re-inserting a previously-shown page (navigating back) still navigates the frame to it', function (assert) {
    const frame = createElement('frame');
    const page1 = createElement('page');
    const page2 = createElement('page');

    const navigatedTo: unknown[] = [];
    frame.nativeView.navigate = ((options: { create: () => unknown }) => {
      navigatedTo.push(options.create());
    }) as typeof frame.nativeView.navigate;

    // Initial mount: the very first page a frame ever receives.
    frame.appendChild(page1);
    assert.deepEqual(navigatedTo, [page1.nativeView], 'navigates to the first page on initial mount');
    assert.equal(frame.currentPage, page1.nativeView, 'currentPage tracks the first page');

    // Route transition: the new page is inserted before the outgoing one is removed.
    frame.insertBefore(page2, page1);
    assert.deepEqual(navigatedTo, [page1.nativeView, page2.nativeView], 'navigates to the second page on transition');
    assert.equal(frame.currentPage, page2.nativeView, 'currentPage tracks the second page');
    frame.removeChild(page1);

    // Navigate back: page1's own component/page instance is reused (kept
    // alive), so the very same node is reinserted - this is the case the
    // pre-fix `currentPage` bookkeeping missed entirely.
    frame.insertBefore(page1, page2);
    assert.deepEqual(
      navigatedTo,
      [page1.nativeView, page2.nativeView, page1.nativeView],
      'navigates back to the first page instead of silently staying on the second',
    );
    assert.equal(frame.currentPage, page1.nativeView, 'currentPage tracks the first page again after navigating back');
  });
});
