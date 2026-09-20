import { a as _applyDecoratedDescriptor, b as _initializerDefineProperty, _ as _defineProperty } from '../_rollupPluginBabelHelpers-apNPIsxw.js';
import Service, { service } from '@ember/service';
import { Application } from '@nativescript/core';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';
import { setOnUnexpectedBack } from '../dom/native/FrameElement.js';

var _dec, _class, _descriptor, _descriptor2, _descriptor3;

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
let HistoryService = (_dec = service('ember-native/native-router'), _class = class HistoryService extends Service {
  constructor(..._args) {
    super(..._args);
    _initializerDefineProperty(this, "router", _descriptor, this);
    _initializerDefineProperty(this, "nativeRouter", _descriptor2, this);
    _initializerDefineProperty(this, "stack", _descriptor3, this);
    _defineProperty(this, "activityBackPressed", args => {
      args.cancel = this.back();
    });
    _defineProperty(this, "back", () => {
      const h = this.stack.pop();
      if (h?.url) {
        this.stack = [...this.stack];
        const transition = this.nativeRouter.transitionToURL(h.url, h.data['transition']);
        transition.data['isBack'] = true;
        return true;
      }
      return false;
    });
  }
  setup() {
    Application.android?.on('activityBackPressed', this.activityBackPressed);
    registerDestructor(this, () => Application.android?.off('activityBackPressed', this.activityBackPressed));

    // iOS's edge swipe-back gesture pops the frame natively, with no event
    // to intercept/cancel the way Android's hardware back key has (see
    // `activityBackPressed` above) - by the time this fires the frame has
    // already visually gone back a page. `back()` here just resyncs Ember's
    // router state to match, it never drives the (already-happened) native
    // pop itself. See `FrameElement`'s `setOnUnexpectedBack` doc comment.
    setOnUnexpectedBack(() => this.back());
    registerDestructor(this, () => setOnUnexpectedBack(null));
    this.router.on('routeWillChange', transition => {
      // The route being left is still current at this point - `didTransition` (which flips
      // `currentURL` to the destination) hasn't run yet. See the `HistoryEntry` doc comment
      // above for why this is read here instead of off `transition.from` later on.
      transition.data['fromURL'] = this.router.currentURL;
    });
    this.router.on('routeDidChange', transition => {
      if (transition.from && !transition.data['isBack']) {
        this.stack.push({
          url: transition.data['fromURL'],
          data: transition.data
        });
        this.stack = [...this.stack];
      }
    });
  }
}, _descriptor = _applyDecoratedDescriptor(_class.prototype, "router", [service], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "nativeRouter", [_dec], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, "stack", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return [];
  }
}), _class);

export { HistoryService as default };
//# sourceMappingURL=history.js.map
