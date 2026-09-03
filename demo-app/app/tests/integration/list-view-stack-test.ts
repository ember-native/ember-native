import { visit, click, settled, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from '../helpers';
import ENV from '~/config/env';
import { pageConstructCount } from '~/lib/list-view-render-count';
import type HistoryService from 'ember-native/services/history';

QUnit.module('Acceptance | list-view page stack', function (hooks) {
  setupApplicationTest(hooks, {});

  QUnit.test(
    'navigating into an item and back does not re-render the list',
    async function (assert) {
      await visit('/list-view');
      const constructCountAfterFirstVisit = pageConstructCount;

      // The same `<page>` element throughout - PageStackOutlet must never
      // remove/recreate it, only toggle its own `visibility`.
      const listPage = ENV.rootElement.getElementById('list-view-page');
      assert.equal(
        listPage?.getAttribute('visibility'),
        'visible',
        'list page starts visible'
      );

      // Tap the first row - navigates into the nested `list-view.item` route.
      // `ListView` rows are realized by a native (Android RecyclerView)
      // layout/bind pass that isn't tracked by Ember's run loop, so the row's
      // `<button>` isn't guaranteed to exist the moment `settled()` resolves
      // - `waitFor` polls until it does.
      await waitFor('button');
      await click('button');
      const itemPage = ENV.rootElement.getElementById('item-page');
      assert.true(
        !!itemPage?.getElementByTagName('actionbar')?.getAttribute('title')?.startsWith('Item'),
        'navigated to the item route'
      );
      assert.equal(
        listPage?.getAttribute('visibility'),
        'collapse',
        'list page is collapsed, not removed, while the item route is active'
      );

      const history = this.owner.lookup('service:ember-native/history') as HistoryService;
      history.back();
      await settled();

      assert.true(
        !!listPage?.getElementByTagName('actionbar')?.getAttribute('title')?.includes('List View'),
        'back on the list route'
      );
      assert.equal(
        listPage?.getAttribute('visibility'),
        'visible',
        'list page is visible again after going back'
      );
      assert.notOk(
        ENV.rootElement.getElementById('item-page'),
        'the item route was torn down by going back'
      );
      assert.equal(
        pageConstructCount,
        constructCountAfterFirstVisit,
        'the list-view Page instance was not re-created by navigating into the item route and back'
      );

      // PROBE (todo #525 follow-up) - keep the app alive long enough to
      // observe FrameElement's delayed [frame-probe] log lines, then remove.
      await new Promise((resolve) => setTimeout(resolve, 6500));
    }
  );
});
