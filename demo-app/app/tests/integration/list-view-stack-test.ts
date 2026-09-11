import { visit, click, settled, waitFor, waitUntil } from '@ember/test-helpers';
import { setupApplicationTest } from '../helpers';
import ENV from '~/config/env';
import { pageConstructCount } from '~/lib/list-view-render-count';
import type HistoryService from 'ember-native/services/history';
import type { Frame } from '@nativescript/core/ui/frame';
import type { Page } from '@nativescript/core/ui/page';

QUnit.module('Acceptance | list-view page stack', function (hooks) {
  setupApplicationTest(hooks, {});

  QUnit.test(
    'navigating into an item and back drives a real Frame backstack, not a re-render',
    async function (assert) {
      await visit('/list-view');
      const constructCountAfterFirstVisit = pageConstructCount;

      const frame: Frame = ENV.rootElement.getElementByTagName('frame').nativeView;

      // The same `<page>` element throughout - `FrameElement` must never
      // remove/recreate it. Ember's own outlet lifecycle keeps it mounted
      // while a child route (`list-view.item`) is active.
      //
      // Comparisons below use `assert.true(a === b, ...)` rather than
      // `assert.strictEqual`/`equal` - QUnit's failure-message diffing walks
      // both values recursively to describe a mismatch, and real native
      // `Frame`/`Page`/`BackstackEntry` objects aren't safe to walk that way
      // (crashes with an unrelated `TypeError` instead of reporting the
      // actual assertion failure). A plain boolean has nothing to diff.
      const listPage = ENV.rootElement.getElementById('list-view-page');
      const listPageNativeView: Page = listPage?.nativeView;

      // `visit()`'s `settled()` only waits for Ember's own run loop - the
      // cold-boot push of `list-view-page` is a real, asynchronous
      // `Frame#navigate()` underneath (see `FrameElement`'s class doc
      // comment), so it isn't necessarily done yet the moment `visit()`
      // resolves.
      await waitUntil(() => frame.currentPage === listPageNativeView, { timeout: 5000 });
      assert.true(
        frame.currentPage === listPageNativeView,
        'the list page is the frame\'s current page'
      );
      assert.false(frame.canGoBack(), 'nothing to go back to yet');

      // Tap the first row - navigates into the nested `list-view.item` route.
      // `ListView` rows are realized by a native (Android RecyclerView)
      // layout/bind pass that isn't tracked by Ember's run loop, so the row's
      // `<button>` isn't guaranteed to exist the moment `settled()` resolves
      // - `waitFor` polls until it does.
      await waitFor('button');
      await click('button');
      const itemPage = ENV.rootElement.getElementById('item-page');
      const itemPageNativeView: Page = itemPage?.nativeView;
      assert.true(
        !!itemPage?.getElementByTagName('actionbar')?.getAttribute('title')?.startsWith('Item'),
        'navigated to the item route'
      );

      // `Frame.navigate()` is asynchronous and internally queued, independent
      // of Ember's own run loop - `settled()`/`click()` don't wait for it
      // (see `FrameElement`'s class doc comment), so poll until it lands.
      await waitUntil(() => frame.currentPage === itemPageNativeView, { timeout: 5000 });
      assert.true(
        frame.canGoBack(),
        'the list page is now on the real Frame backstack'
      );
      assert.equal(
        frame.backStack.length,
        1,
        'exactly one backstack entry - the list page'
      );
      assert.true(
        frame.backStack[0]?.resolvedPage === listPageNativeView,
        'the backstacked entry is the same list page instance, not a new one'
      );

      const history = this.owner.lookup(
        'service:ember-native/history'
      ) as HistoryService;
      history.back();
      await settled();

      assert.true(
        !!listPage?.getElementByTagName('actionbar')?.getAttribute('title')?.includes('List View'),
        'back on the list route'
      );
      assert.notOk(
        ENV.rootElement.getElementById('item-page'),
        'the item route was torn down by going back'
      );

      // NOT `waitUntil(() => !frame.canGoBack())`: `canGoBack()` is
      // predictive - it looks ahead into the frame's own pending
      // navigation queue and reports what the backstack *will* be once
      // queued operations settle, so it already flips to `false` the
      // instant our `goBack()` is *queued*, not once it *completes*.
      // `currentPage`, like everywhere else in this test, only updates once
      // the navigation genuinely finishes.
      await waitUntil(() => frame.currentPage === listPageNativeView, { timeout: 5000 });
      assert.true(
        frame.currentPage === listPageNativeView,
        'the list page is the frame\'s current page again, the same instance as before'
      );
      assert.false(frame.canGoBack(), 'the backstack is empty again after going back');
      assert.equal(
        pageConstructCount,
        constructCountAfterFirstVisit,
        'the list-view Page instance was not re-created by navigating into the item route and back'
      );
    }
  );

  QUnit.test(
    'a cross-tree jump straight into a nested route seeds the ancestor into the backstack in a single transition',
    async function (assert) {
      // `index` is an unrelated top-level route - `list-view` (the parent of
      // the route we're about to jump into) is never visited on its own, so
      // `FrameElement.reconcile()` sees a common-prefix-zero jump into a
      // 2-deep desired stack (`list-view` + `list-view.item`) - the case
      // `navigateToLeaf`'s multi-page batching exists for (see
      // `FrameElement.ts`).
      await visit('/');
      const frame: Frame = ENV.rootElement.getElementByTagName('frame').nativeView;
      await waitUntil(() => !!frame.currentPage, { timeout: 5000 });
      assert.false(frame.canGoBack(), 'nothing to go back to yet');

      await visit('/list-view/a');

      const listPage = ENV.rootElement.getElementById('list-view-page');
      const listPageNativeView: Page = listPage?.nativeView;
      const itemPage = ENV.rootElement.getElementById('item-page');
      const itemPageNativeView: Page = itemPage?.nativeView;

      await waitUntil(() => frame.currentPage === itemPageNativeView, { timeout: 5000 });

      assert.true(
        frame.canGoBack(),
        'the list page landed on the real Frame backstack even though it was never its own transition'
      );
      assert.equal(
        frame.backStack.length,
        1,
        'exactly one backstack entry - the seeded list page, not the index page or two entries'
      );
      assert.true(
        frame.backStack[0]?.resolvedPage === listPageNativeView,
        'the seeded backstack entry is the same list-view Page instance Ember rendered'
      );

      // The discriminating check: `list-view`'s own page got an unanimated
      // `navigate()` batched ahead of `list-view.item`'s (see
      // `navigateToLeaf`) - going back to it is what actually proves that
      // real, queued `navigate()` renders and settles correctly on a real
      // device, not just that the JS-level `backStack` array looks right.
      //
      // Not `history.back()`: `HistoryService`'s stack recorded a single
      // entry for the whole `/` -> `/list-view/a` jump (one router
      // transition, however many nested levels it spans), so `back()` would
      // undo the entire jump and land on `/` again, skipping the seeded
      // `list-view` entry entirely. Visiting `/list-view` directly instead
      // is the single in-tree step from `list-view.item` back to its parent
      // - exactly the case `FrameElement.reconcile()` resolves with a real
      // `goBack()` to the seeded backstack entry (`i !== 0` in
      // `reconcile()`, not another cross-tree replace).
      await visit('/list-view');
      await waitUntil(() => frame.currentPage === listPageNativeView, { timeout: 5000 });

      assert.true(
        !!listPage?.getElementByTagName('actionbar')?.getAttribute('title')?.includes('List View'),
        'going back from the seeded jump renders the real list-view page, not a blank/broken fragment'
      );
      assert.false(
        frame.canGoBack(),
        'the backstack is empty again after going back to the seeded root'
      );

      // The actual regression this guards against: landing back on a page
      // that was pushed via an unanimated, batched `navigate()` (rather
      // than its own `reconcile()` step) must not leave `FrameElement`'s
      // `reconciling` flag stuck. If it did, this next forward navigate()
      // would never resolve, and - since `reconcile()` only ever runs again
      // from the settle handler of a navigation that itself never settles -
      // every future route change anywhere in the app would silently stop
      // working too. Asserting on `frame.currentPage`/`frame.backStack`
      // (not just DOM-shim state) matters here: a stuck `reconciling` still
      // leaves `childNodes` looking correct, since Ember's own render
      // already happened.
      await visit('/list-view/a');
      const itemPageAgain = ENV.rootElement.getElementById('item-page');
      const itemPageAgainNativeView: Page = itemPageAgain?.nativeView;
      await waitUntil(() => frame.currentPage === itemPageAgainNativeView, {
        timeout: 5000,
      });

      assert.true(
        !!itemPageAgain?.getElementByTagName('actionbar')?.getAttribute('title')?.startsWith('Item'),
        'navigating forward again after landing on the seeded entry still reaches the item route'
      );
      assert.true(
        frame.canGoBack(),
        'the seeded list page is back on the real Frame backstack after the second forward navigate'
      );
      assert.equal(
        frame.backStack.length,
        1,
        'exactly one backstack entry again - the list page'
      );
    }
  );
});
