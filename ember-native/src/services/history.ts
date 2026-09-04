import Service, { service } from '@ember/service';
import { Application } from '@nativescript/core';
import { tracked } from '@glimmer/tracking';
import type NativeRouter from './native-router.ts';
import type Router from '@ember/routing/router';
import type { Transition } from 'router_js';
import { registerDestructor } from '@ember/destroyable';
import { setOnUnexpectedBack } from '../dom/native/FrameElement.ts';

/**
 * A snapshot of the URL `back()` should return to, captured from `router.currentURL` in
 * `routeWillChange` - while the route being left is still the router's actual current route -
 * rather than read off `Transition['from']`'s `RouteInfo` at any later point.
 *
 * `RouteInfo` is an object router_js owns and keeps mutating/reusing for a route across
 * transitions, most visibly for a same-route dynamic-segment change (e.g. `commit-detail`'s
 * `navigateToParent`, which transitions from `commit-detail` back to `commit-detail` under a
 * different sha) - so its `params`/`queryParams` are not a reliable point-in-time snapshot no
 * matter how early after the transition they're read. `b69ef22` moved this capture from `back()`
 * reading it lazily at pop time to `setup()` copying it eagerly at push time (in
 * `routeDidChange`), which closes the widest version of the gap but not all of it: the same
 * route's `RouteInfo` can already read back empty by the time `routeDidChange` fires for it a
 * second time. `currentURL` is a plain string the router computes once per settled transition -
 * once read here it can't be mutated out from under us the way a `RouteInfo`'s properties can,
 * and it round-trips the full destination (route, dynamic segments, and query params alike)
 * through `router.transitionTo` without needing to reconstruct any of them separately.
 */
type HistoryEntry = {
  url: string;
  data: Transition['data'];
};

export default class HistoryService extends Service {
  @service router!: Router;
  @service('ember-native/native-router') nativeRouter!: NativeRouter;
  @tracked stack: HistoryEntry[] = [];

  setup() {
    Application.android?.on('activityBackPressed', this.activityBackPressed);
    registerDestructor(this, () =>
      Application.android?.off('activityBackPressed', this.activityBackPressed),
    );

    // iOS's edge swipe-back gesture pops the frame natively, with no event
    // to intercept/cancel the way Android's hardware back key has (see
    // `activityBackPressed` above) - by the time this fires the frame has
    // already visually gone back a page. `back()` here just resyncs Ember's
    // router state to match, it never drives the (already-happened) native
    // pop itself. See `FrameElement`'s `setOnUnexpectedBack` doc comment.
    setOnUnexpectedBack(() => this.back());
    registerDestructor(this, () => setOnUnexpectedBack(null));

    this.router.on('routeWillChange', (transition) => {
      // The route being left is still current at this point - `didTransition` (which flips
      // `currentURL` to the destination) hasn't run yet. See the `HistoryEntry` doc comment
      // above for why this is read here instead of off `transition.from` later on.
      transition.data['fromURL'] = this.router.currentURL;
    });
    this.router.on('routeDidChange', (transition) => {
      if (transition.from && !transition.data['isBack']) {
        this.stack.push({
          url: transition.data['fromURL'] as string,
          data: transition.data,
        });
        this.stack = [...this.stack];
      }
    });
  }

  activityBackPressed = (args: { cancel: boolean }) => {
    args.cancel = this.back();
  };

  back = () => {
    const h = this.stack.pop();
    if (h?.url) {
      this.stack = [...this.stack];
      const transition = this.nativeRouter.transitionToURL(h.url, h.data['transition'] as any);
      transition.data['isBack'] = true;
      return true;
    }
    return false;
  };
}
