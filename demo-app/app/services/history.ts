import Service, { service } from '@ember/service';
import { Application } from '@nativescript/core';
import {tracked} from "@glimmer/tracking";

export default class HistoryService extends Service {
  @service router;
  @tracked stack = [];

  setup() {
    Application.android?.on('activityBackPressed', (args) => {
      args.cancel = this.back();
    })
    this.router.on('routeDidChange', (transition) => {
      console.log('routeDidChange');
      if (transition.from && !transition.data.isBack) {
        this.stack.push(transition.from);
      }
      this.stack = [...this.stack];
    })
  }

  back = () => {
    const h = this.stack.pop();
    if (h) {
      this.stack = [...this.stack];
      let transition;
      if (h.params.model) {
        transition = this.router.transitionTo(h.name, h.params.model, {
          queryParams: h.queryParams
        });
      } else {
        transition = this.router.transitionTo(h.name, {
          queryParams: h.queryParams
        });
      }
      transition.data.isBack = true;
      return true;
    }
    return false;
  }
}
