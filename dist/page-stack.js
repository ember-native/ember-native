import { a as _applyDecoratedDescriptor, b as _initializerDefineProperty } from './_rollupPluginBabelHelpers-apNPIsxw.js';
import { tracked } from '@glimmer/tracking';

var _class, _descriptor, _descriptor2;
let nextKey = 0;
/**
 * A stack of entries that, once pushed, stay mounted (rendered by
 * `PageStackView`) until explicitly evicted - only `activeKey` changes when
 * navigating back and forth, so returning to a previous entry shows it
 * instantly instead of re-rendering it. This is the same "don't recreate a
 * screen you've already visited" behavior NativeScript's own `Frame`
 * backstack gives natively, made available here for navigation that isn't
 * driven by the Ember router - see `PageStackOutlet` for router-driven
 * sub-route stacking, which relies on Ember's own outlet lifecycle instead
 * of this class.
 */
let PageStack = (_class = class PageStack {
  constructor() {
    _initializerDefineProperty(this, "entries", _descriptor, this);
    _initializerDefineProperty(this, "activeKey", _descriptor2, this);
  }
  get activeIndex() {
    return this.entries.findIndex(entry => entry.key === this.activeKey);
  }

  /** Pushes (or, if `key` is already present, reactivates) an entry. */
  push(content, key = nextKey++) {
    if (!this.entries.some(entry => entry.key === key)) {
      this.entries = [...this.entries, {
        key,
        content
      }];
    }
    this.activeKey = key;
    return key;
  }

  /** Activates the entry just below the current one, if any. Does not evict either. */
  pop() {
    const index = this.activeIndex;
    if (index <= 0) {
      return false;
    }
    this.activeKey = this.entries[index - 1].key;
    return true;
  }

  /** Activates an already-pushed entry directly, without disturbing the rest of the stack. */
  goTo(key) {
    if (!this.entries.some(entry => entry.key === key)) {
      return false;
    }
    this.activeKey = key;
    return true;
  }

  /** Discards a cached entry entirely - pushing it again later renders it fresh. */
  evict(key) {
    this.entries = this.entries.filter(entry => entry.key !== key);
    if (this.activeKey === key) {
      this.activeKey = this.entries.at(-1)?.key ?? null;
    }
  }
}, _descriptor = _applyDecoratedDescriptor(_class.prototype, "entries", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return [];
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "activeKey", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return null;
  }
}), _class);

export { PageStack as default };
//# sourceMappingURL=page-stack.js.map
