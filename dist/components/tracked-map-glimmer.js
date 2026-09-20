import { a as _applyDecoratedDescriptor, b as _initializerDefineProperty } from '../_rollupPluginBabelHelpers-apNPIsxw.js';
import { tracked } from '@glimmer/tracking';
import { isTracking } from '@glimmer/validator';

var _class, _descriptor, _class2, _descriptor2;
let TrackedStructureSignal = (_class = class TrackedStructureSignal {
  constructor() {
    _initializerDefineProperty(this, "counter", _descriptor, this);
  }
  read() {
    // Consume the tag; the value itself is irrelevant.
    void this.counter;
  }
  bump() {
    this.counter += 1;
  }
}, _descriptor = _applyDecoratedDescriptor(_class.prototype, "counter", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _class);
let TrackedValueCell = (_class2 = class TrackedValueCell {
  constructor(initial) {
    _initializerDefineProperty(this, "value", _descriptor2, this);
    this.value = initial;
  }
  get() {
    return this.value;
  }
  set(value) {
    this.value = value;
  }
}, _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "value", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _class2); // Production hooks: back TrackedMap's signals with Glimmer autotracking and
// defer bumps via a microtask. See tracked-map.ts for why the deferral matters.
function glimmerTrackedMapHooks() {
  return {
    createStructureSignal: () => new TrackedStructureSignal(),
    createValueCell: initial => new TrackedValueCell(initial),
    isTracking,
    schedule: fn => queueMicrotask(fn)
  };
}

export { glimmerTrackedMapHooks };
//# sourceMappingURL=tracked-map-glimmer.js.map
