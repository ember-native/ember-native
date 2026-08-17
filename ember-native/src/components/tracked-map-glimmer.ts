import { tracked } from '@glimmer/tracking';
import { isTracking } from '@glimmer/validator';
import type {
  StructureSignal,
  TrackedMapHooks,
  ValueCell,
} from './tracked-map.ts';

class TrackedStructureSignal implements StructureSignal {
  @tracked private counter = 0;
  read(): void {
    // Consume the tag; the value itself is irrelevant.
    void this.counter;
  }
  bump(): void {
    this.counter += 1;
  }
}

class TrackedValueCell<V> implements ValueCell<V> {
  @tracked private value: V;
  constructor(initial: V) {
    this.value = initial;
  }
  get(): V {
    return this.value;
  }
  set(value: V): void {
    this.value = value;
  }
}

// Production hooks: back TrackedMap's signals with Glimmer autotracking and
// defer bumps via a microtask. See tracked-map.ts for why the deferral matters.
export function glimmerTrackedMapHooks<V>(): TrackedMapHooks<V> {
  return {
    createStructureSignal: () => new TrackedStructureSignal(),
    createValueCell: (initial: V) => new TrackedValueCell(initial),
    isTracking,
    schedule: (fn) => queueMicrotask(fn),
  };
}
