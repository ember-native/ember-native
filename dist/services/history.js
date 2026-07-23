import { a as _applyDecoratedDescriptor, b as _initializerDefineProperty, _ as _defineProperty } from '../_rollupPluginBabelHelpers-apNPIsxw.js';
import Service, { service } from '@ember/service';
import { Application } from '@nativescript/core';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

var _dec, _class, _descriptor, _descriptor2, _descriptor3;
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
      if (h?.from) {
        const from = h.from;
        this.stack = [...this.stack];
        // `from.params` is always an object, even `{}` for routes with no
        // dynamic segments (e.g. `index`). Passing that empty object through
        // as a context/model makes Ember's router throw "More context
        // objects were passed than there are dynamic segments for the
        // route", so only forward it when it actually holds a segment value.
        const hasDynamicSegments = from.params && Object.keys(from.params).length > 0;
        const transition = this.nativeRouter.transitionTo(from.name, hasDynamicSegments ? from.params : undefined, {
          queryParams: from.queryParams
        }, h.data['transition']);
        transition.data['isBack'] = true;
        return true;
      }
      return false;
    });
  }
  setup() {
    Application.android?.on('activityBackPressed', this.activityBackPressed);
    registerDestructor(this, () => Application.android?.off('activityBackPressed', this.activityBackPressed));
    this.router.on('routeDidChange', transition => {
      if (transition.from && !transition.data['isBack']) {
        this.stack.push(transition);
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
