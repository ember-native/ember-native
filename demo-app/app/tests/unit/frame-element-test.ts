import { setupRenderingTest } from '~/tests/helpers';
import { waitUntil } from '@ember/test-helpers';
import { createElement } from 'ember-native/dom/element-registry';

// Regression coverage for `FrameElement`'s reconciler (see its class doc
// comment in ember-native/src/dom/native/FrameElement.ts) - it drives a
// *real* `Frame` backstack from the `<page>` elements Ember mounts as this
// element's children (`navigate()`/`goBack()`, gated by the frame's own
// `navigatedTo` event), instead of the old strategy of keeping every
// route's page mounted side by side and toggling `visibility`.
//
// `Frame.navigate()`/`goBack()` are genuinely asynchronous and internally
// queued in the real app - a CI probe run (`investigate/frame-page-stack-
// probe`) confirmed a page can be inserted *and removed again* before its
// own forward `navigate()` has even started processing, at which point
// `canGoBack()` still reads `false`. To exercise that timing deterministically
// (rather than depending on real on-device animation/attach latency, which
// isn't available to a detached, off-screen `Frame` in a rendering test
// anyway), `navigate()`/`goBack()` are stubbed here to settle on a
// microtask - genuinely asynchronous, but not tied to real device timing -
// and drive the frame's real `backStack`/`currentPage`/`navigatedTo`
// machinery by hand, so `FrameElement`'s own constructor-installed listener
// and `reconcile()` diff logic run for real.
function installFakeNativeNavigation(nativeFrame: any) {
  nativeFrame._backStack = [];
  nativeFrame._fakeCurrentEntry = undefined;
  nativeFrame._navigateCallCount = 0;

  Object.defineProperty(nativeFrame, 'backStack', {
    configurable: true,
    get: () => nativeFrame._backStack,
  });
  Object.defineProperty(nativeFrame, 'currentPage', {
    configurable: true,
    get: () => nativeFrame._fakeCurrentEntry?.resolvedPage,
  });

  nativeFrame.canGoBack = () => nativeFrame._backStack.length > 0;

  nativeFrame.navigate = (options: any) => {
    nativeFrame._navigateCallCount++;
    queueMicrotask(() => {
      const prevEntry = nativeFrame._fakeCurrentEntry;
      if (options.clearHistory) {
        nativeFrame._backStack = [];
      } else if (prevEntry) {
        nativeFrame._backStack = [...nativeFrame._backStack, prevEntry];
      }
      const entry = { resolvedPage: options.create(), entry: options };
      nativeFrame._fakeCurrentEntry = entry;
      nativeFrame.notify({
        eventName: 'navigatedTo',
        object: nativeFrame,
        isBack: false,
        entry,
      });
    });
  };

  nativeFrame.goBack = (backstackEntry: any) => {
    queueMicrotask(() => {
      const index = nativeFrame._backStack.indexOf(backstackEntry);
      nativeFrame._backStack = nativeFrame._backStack.slice(0, index);
      nativeFrame._fakeCurrentEntry = backstackEntry;
      nativeFrame.notify({
        eventName: 'navigatedTo',
        object: nativeFrame,
        isBack: true,
        entry: backstackEntry,
      });
    });
  };
}

QUnit.module('FrameElement | real Frame backstack', function (hooks) {
  setupRenderingTest(hooks);

  QUnit.test(
    'pushing and popping a nested page drives a real backstack, reusing the same page instance',
    async function (assert) {
      const frame = createElement('frame');
      installFakeNativeNavigation(frame.nativeView);
      const page1 = createElement('page');
      const page2 = createElement('page');

      frame.appendChild(page1);
      await waitUntil(() => frame.nativeView.currentPage === page1.nativeView);
      assert.false(frame.nativeView.canGoBack(), 'nothing to go back to on initial mount');

      // A nested route's page is appended as a sibling *after* the
      // parent's own (see `FrameOutlet`) - Ember keeps the parent mounted,
      // it's never removed here.
      frame.appendChild(page2);
      await waitUntil(() => frame.nativeView.currentPage === page2.nativeView);
      assert.true(frame.nativeView.canGoBack(), 'the parent page is now on the real backstack');
      assert.strictEqual(frame.nativeView.backStack.length, 1);
      assert.strictEqual(frame.nativeView.backStack[0]?.resolvedPage, page1.nativeView);

      // Navigating back up removes the child's page - Ember never destroys
      // page1's component/page instance, so this is the exact same node.
      frame.removeChild(page2);
      await waitUntil(() => !frame.nativeView.canGoBack());
      assert.strictEqual(
        frame.nativeView.currentPage,
        page1.nativeView,
        'back to the same parent page instance, not a re-created one',
      );
    },
  );

  QUnit.test(
    "removing a page before its own forward navigate() has settled still converges correctly",
    async function (assert) {
      const frame = createElement('frame');
      installFakeNativeNavigation(frame.nativeView);
      const page1 = createElement('page');
      const page2 = createElement('page');

      frame.appendChild(page1);
      await waitUntil(() => frame.nativeView.currentPage === page1.nativeView);

      // Insert and remove page2 in the same synchronous tick - the
      // reconciler hasn't even had a microtask to look at this yet, let
      // alone had page2's own `navigate()` start, so this reproduces the
      // probe's exact race instead of only the happy path.
      frame.appendChild(page2);
      frame.removeChild(page2);

      await waitUntil(
        () => frame.nativeView.currentPage === page1.nativeView && !frame.nativeView.canGoBack(),
      );
      assert.strictEqual(
        frame.nativeView.currentPage,
        page1.nativeView,
        'settles back on page1, not stuck on page2',
      );
      assert.false(
        frame.nativeView.canGoBack(),
        'the backstack is empty - page2 never actually stuck around',
      );
    },
  );

  QUnit.test(
    'a two-level-deep push and pop converges one native step at a time',
    async function (assert) {
      const frame = createElement('frame');
      installFakeNativeNavigation(frame.nativeView);
      const page1 = createElement('page');
      const page2 = createElement('page');
      const page3 = createElement('page');

      frame.appendChild(page1);
      await waitUntil(() => frame.nativeView.currentPage === page1.nativeView);
      frame.appendChild(page2);
      await waitUntil(() => frame.nativeView.currentPage === page2.nativeView);
      frame.appendChild(page3);
      await waitUntil(() => frame.nativeView.currentPage === page3.nativeView);
      assert.strictEqual(frame.nativeView.backStack.length, 2);

      // Going back one level at a time (each settling before the next
      // starts) issues one native `goBack()` step per level - the
      // reconciler never has two native operations in flight together.
      frame.removeChild(page3);
      await waitUntil(() => frame.nativeView.currentPage === page2.nativeView);
      assert.strictEqual(frame.nativeView.backStack.length, 1);

      frame.removeChild(page2);
      await waitUntil(
        () => frame.nativeView.currentPage === page1.nativeView && !frame.nativeView.canGoBack(),
      );
      assert.strictEqual(frame.nativeView.currentPage, page1.nativeView);
      assert.false(frame.nativeView.canGoBack());
    },
  );

  QUnit.test(
    'pushing two nested pages in the same batch settles as one reconcile step on Android',
    async function (assert) {
      // Simulates a single Ember route transition that activates two
      // nested routes at once (both `<page>`s land in `childNodes` before
      // `reconcile()` gets a microtask to look at either) - the scenario
      // `navigateToLeaf`'s batched-`navigate()` path exists for (see
      // `FrameElement`'s class doc comment and `navigateToLeaf`).
      const frame = createElement('frame');
      installFakeNativeNavigation(frame.nativeView);
      const page1 = createElement('page');
      const page2 = createElement('page');
      const page3 = createElement('page');

      frame.appendChild(page1);
      await waitUntil(() => frame.nativeView.currentPage === page1.nativeView);

      frame.appendChild(page2);
      frame.appendChild(page3);
      await waitUntil(() => frame.nativeView.currentPage === page3.nativeView);

      // Both platforms end up issuing a real `navigate()` per page (one for
      // page1's initial mount, one each for page2/page3) - what differs is
      // *when*: on Android, `navigateToLeaf` issues page2's and page3's
      // `navigate()` calls back to back in the same synchronous batch
      // (page2's unanimated, only page3's animated), relying on `Frame`'s
      // own internal navigation queue to serialize them, instead of waiting
      // for a full `reconcile()`/settle round trip between them the way iOS
      // does.
      const navigateCallCount = (frame.nativeView as any)._navigateCallCount;
      assert.strictEqual(navigateCallCount, 3);
      assert.strictEqual(frame.nativeView.backStack.length, 2);
      assert.strictEqual(frame.nativeView.backStack[0]?.resolvedPage, page1.nativeView);
      assert.strictEqual(
        frame.nativeView.backStack[1]?.resolvedPage,
        page2.nativeView,
        'page2 landed on the real backstack even though its own navigate() never left this batch',
      );

      // Going back should land on page2, the same instance either way.
      frame.removeChild(page3);
      await waitUntil(() => frame.nativeView.currentPage === page2.nativeView);
      assert.strictEqual(frame.nativeView.backStack.length, 1);

      frame.removeChild(page2);
      await waitUntil(
        () => frame.nativeView.currentPage === page1.nativeView && !frame.nativeView.canGoBack(),
      );

      // The actual regression this guards against: landing on a page that
      // arrived via an unanimated, batched `navigate()` must not leave
      // `FrameElement`'s reconciling lifecycle stuck - a further forward
      // push afterward has to settle too.
      frame.appendChild(page2);
      await waitUntil(() => frame.nativeView.currentPage === page2.nativeView);
      assert.strictEqual(
        frame.nativeView.currentPage,
        page2.nativeView,
        'navigating forward again after the batched push still settles',
      );
    },
  );
});
