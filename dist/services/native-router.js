
import { a as _applyDecoratedDescriptor, b as _initializerDefineProperty } from '../_rollupPluginBabelHelpers-ClPBvGFm.js';
import Service, { service } from '@ember/service';
import { setNextTransition } from '../dom/native/FrameElement.js';

var _class, _descriptor;
let NativeRouter = (_class = class NativeRouter extends Service {
  constructor(...args) {
    super(...args);
    _initializerDefineProperty(this, "router", _descriptor, this);
  }
  transitionTo(name, model, queryParams, transition, backTransition) {
    setNextTransition(transition?.transition, transition?.animated);
    let t;
    if (model) {
      t = this.router.transitionTo(name, model, {
        queryParams
      });
    } else {
      t = this.router.transitionTo(name, {
        queryParams
      });
    }
    t.data['transition'] = backTransition || transition;
    return t;
  }
}, _descriptor = _applyDecoratedDescriptor(_class.prototype, "router", [service], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _class);

export { NativeRouter as default };
//# sourceMappingURL=native-router.js.map
