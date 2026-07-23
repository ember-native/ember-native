import Service, { service } from '@ember/service';
import { Application } from '@nativescript/core';
import { tracked } from '@glimmer/tracking';
import type NativeRouter from './native-router.ts';
import type Router from '@ember/routing/router';
import type { Transition } from 'router_js';
import { registerDestructor } from '@ember/destroyable';

export default class HistoryService extends Service {
  @service router!: Router;
  @service('ember-native/native-router') nativeRouter!: NativeRouter;
  @tracked stack: Transition[] = [];

  setup() {
    Application.android?.on('activityBackPressed', this.activityBackPressed);
    registerDestructor(this, () =>
      Application.android?.off('activityBackPressed', this.activityBackPressed),
    );
    this.router.on('routeDidChange', (transition) => {
      if (transition.from && !transition.data['isBack']) {
        this.stack.push(transition);
        this.stack = [...this.stack];
      }
    });
  }

  activityBackPressed = (args: { cancel: boolean }) => {
    args.cancel = this.back();
  };

  back = () => {
    const h = this.stack.pop();
    if (h?.from) {
      const from = h.from;
      this.stack = [...this.stack];
      // `from.params` is always an object, even `{}` for routes with no
      // dynamic segments (e.g. `index`). Passing that empty object through
      // as a context/model makes Ember's router throw "More context
      // objects were passed than there are dynamic segments for the
      // route", so only forward it when it actually holds a segment value.
      const hasDynamicSegments = from.params && Object.keys(from.params).length > 0;
      const transition = this.nativeRouter.transitionTo(
        from.name,
        hasDynamicSegments ? from.params : undefined,
        {
          queryParams: from.queryParams,
        },
        h.data['transition'] as any,
      );
      transition.data['isBack'] = true;
      return true;
    }
    return false;
  };
}
