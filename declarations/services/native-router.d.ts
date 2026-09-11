import Service from '@ember/service';
import Router from '@ember/routing/router';
import type { NavigationTransition } from '@nativescript/core';
import type { Transition } from 'router_js';
export default class NativeRouter extends Service {
    router: Router;
    transitionTo(name: string, model: any, queryParams?: Record<string, any>, transition?: {
        transition: NavigationTransition;
        animated: boolean;
    }, backTransition?: {
        transition: NavigationTransition;
        animated: boolean;
    }): Transition;
    /**
     * Same as {@link transitionTo}, but for transitioning to a full URL (route + dynamic segments
     * + query params already resolved into one string) rather than reconstructing them from a
     * route name and separate models/query-params - see `HistoryService`'s doc comment for why
     * `back()` uses this instead.
     */
    transitionToURL(url: string, transition?: {
        transition: NavigationTransition;
        animated: boolean;
    }): Transition;
}
