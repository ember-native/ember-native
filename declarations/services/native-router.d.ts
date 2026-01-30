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
}
