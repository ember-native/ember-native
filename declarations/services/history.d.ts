import Service from '@ember/service';
import type NativeRouter from './native-router.ts';
import type Router from '@ember/routing/router';
import type { Transition } from 'router_js';
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
    router: Router;
    nativeRouter: NativeRouter;
    stack: HistoryEntry[];
    setup(): void;
    activityBackPressed: (args: {
        cancel: boolean;
    }) => void;
    back: () => boolean;
}
export {};
