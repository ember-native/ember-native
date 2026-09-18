import { _ as _defineProperty } from '../_rollupPluginBabelHelpers-apNPIsxw.js';

// The signals TrackedMap reads/bumps for its tracking bookkeeping. They're
// abstracted behind these interfaces so TrackedMap carries no direct
// dependency on Glimmer's autotracking runtime, which lets its
// coalescing/deferral logic be exercised in a plain node test (see
// tracked-map.test.ts). Production wires the Glimmer-backed implementation in
// RadListView.

// A "structure" signal, read on every `keys()` and bumped on structural
// changes (add/delete), so key-set consumers revalidate only when the set of
// keys actually changes.

// A per-entry tracked cell. Wrapping each value in its own signal means
// updating one entry only invalidates consumers of that entry rather than
// everything that reads the map.

// A Map whose per-key values are individually tracked, so updating one
// entry only invalidates consumers of that entry rather than everything
// that reads the map (e.g. a `keys()`-derived list).
class TrackedMap {
  constructor(hooks) {
    _defineProperty(this, "structure", void 0);
    _defineProperty(this, "map", new Map());
    _defineProperty(this, "hooks", void 0);
    // True while a deferred `structure` bump is already queued, so a burst of
    // structural changes in one tick coalesces into a single increment - see
    // `bumpStructure`.
    _defineProperty(this, "structureBumpScheduled", false);
    this.hooks = hooks;
    this.structure = hooks.createStructureSignal();
  }

  // Bump the structure signal synchronously in the common case, but defer to a
  // microtask when we're currently inside an active autotracking frame.
  //
  // `set`/`delete` are driven synchronously by the native RadListView (a
  // cell's `bindingContext` setter on bind -> `set`, and `cleanup` on
  // `itemRecyclingInternal` -> `delete`). During a route transition that tears
  // this list's outlet down, one of those can fire *inside* the outlet-swap
  // render computation, which has already read `structure` via the `items`
  // getter's `keys()`. Bumping the tag there trips Glimmer's backtracking
  // assertion ("attempted to update `structure`... already used previously in
  // the same computation"). Deferring in that case lets the current
  // computation close first; the underlying `map` is still mutated
  // synchronously (so the very next read sees correct data), only the tag's
  // revalidation slips one microtask later.
  //
  // The `isTracking()` guard keeps the hot path synchronous: plain scrolling
  // recycles cells from native scroll callbacks that run *outside* any tracking
  // frame, so an unconditional microtask defer would force an extra Glimmer
  // revalidation pass per recycle on top of the native scroll frames, making
  // fast scrolling visibly sluggish.
  bumpStructure() {
    if (!this.hooks.isTracking()) {
      this.structure.bump();
      return;
    }
    if (this.structureBumpScheduled) {
      return;
    }
    this.structureBumpScheduled = true;
    this.hooks.schedule(() => {
      this.structureBumpScheduled = false;
      this.structure.bump();
    });
  }
  set(key, value) {
    const existing = this.map.get(key);
    if (existing) {
      existing.set(value);
    } else {
      this.map.set(key, this.hooks.createValueCell(value));
      this.bumpStructure();
    }
    return this;
  }
  get(key) {
    return this.map.get(key)?.get();
  }
  delete(key) {
    const deleted = this.map.delete(key);
    if (deleted) {
      this.bumpStructure();
    }
    return deleted;
  }
  keys() {
    // Read `structure` so callers that only need the set of keys (not the
    // values) don't get invalidated by unrelated per-key value updates.
    this.structure.read();
    return [...this.map.keys()];
  }

  // Untracked entry count. Deliberately does NOT read `structure`, so it can
  // be used on native (non-tracked) callback paths to cheaply decide whether a
  // structural change is even necessary, without pulling the caller into
  // autotracking.
  get size() {
    return this.map.size;
  }
}

export { TrackedMap as default };
//# sourceMappingURL=tracked-map.js.map
