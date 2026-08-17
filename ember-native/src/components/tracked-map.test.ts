/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TrackedMap, {
  type StructureSignal,
  type TrackedMapHooks,
  type ValueCell,
} from './tracked-map.ts';

// A fake harness that stands in for the Glimmer/native runtime so the
// scheduling logic in TrackedMap.bumpStructure can be exercised in plain node.
// It records structure reads/bumps, lets a test pretend it's inside an
// autotracking frame, and holds deferred callbacks so a test controls exactly
// when the "microtask" runs.
function createHarness<V>() {
  let structureReads = 0;
  let structureBumps = 0;
  let tracking = false;
  const scheduled: Array<() => void> = [];

  const structure: StructureSignal = {
    read: () => {
      structureReads += 1;
    },
    bump: () => {
      structureBumps += 1;
    },
  };

  const hooks: TrackedMapHooks<V> = {
    createStructureSignal: () => structure,
    createValueCell: (initial: V): ValueCell<V> => {
      let value = initial;
      return {
        get: () => value,
        set: (v) => {
          value = v;
        },
      };
    },
    isTracking: () => tracking,
    schedule: (fn) => {
      scheduled.push(fn);
    },
  };

  return {
    hooks,
    get structureReads() {
      return structureReads;
    },
    get structureBumps() {
      return structureBumps;
    },
    get pendingCount() {
      return scheduled.length;
    },
    setTracking(value: boolean) {
      tracking = value;
    },
    // Drain every queued deferral, as the microtask queue would after the
    // current computation closes.
    flush() {
      const toRun = scheduled.splice(0);
      for (const fn of toRun) {
        fn();
      }
    },
  };
}

test('bumps the structure signal synchronously when not inside a tracking frame (hot scroll path)', () => {
  const h = createHarness<number>();
  const map = new TrackedMap<string, number>(h.hooks);

  map.set('a', 1);
  map.set('b', 2);

  assert.equal(h.structureBumps, 2, 'each new key bumps immediately');
  assert.equal(h.pendingCount, 0, 'nothing was deferred outside a tracking frame');
});

test('defers the structure bump when inside a tracking frame (route-teardown backtracking fix)', () => {
  const h = createHarness<number>();
  const map = new TrackedMap<string, number>(h.hooks);

  h.setTracking(true);
  map.set('a', 1);

  assert.equal(
    h.structureBumps,
    0,
    'no synchronous bump while a computation is reading the tag',
  );
  assert.equal(h.pendingCount, 1, 'the bump was scheduled for later');

  h.flush();
  assert.equal(h.structureBumps, 1, 'the deferred bump runs after the frame closes');
});

test('coalesces a burst of structural changes in one tracking frame into a single deferred bump', () => {
  const h = createHarness<number>();
  const map = new TrackedMap<string, number>(h.hooks);

  h.setTracking(true);
  map.set('a', 1);
  map.set('b', 2);
  map.set('c', 3);
  map.delete('a');

  assert.equal(h.pendingCount, 1, 'only one deferral is queued for the whole burst');
  assert.equal(h.structureBumps, 0, 'still nothing bumped synchronously');

  h.flush();
  assert.equal(h.structureBumps, 1, 'the coalesced burst produces exactly one bump');
});

test('mutates the underlying map synchronously even when the bump is deferred', () => {
  const h = createHarness<number>();
  const map = new TrackedMap<string, number>(h.hooks);

  h.setTracking(true);
  map.set('a', 1);
  map.set('b', 2);

  // Data is visible immediately; only the tag revalidation slips a tick.
  assert.deepEqual(map.keys(), ['a', 'b']);
  assert.equal(map.get('a'), 1);
  assert.equal(map.get('b'), 2);
  assert.equal(h.structureBumps, 0, 'the deferred bump has not fired yet');
});

test('updating an existing key changes the value without bumping structure', () => {
  const h = createHarness<number>();
  const map = new TrackedMap<string, number>(h.hooks);

  map.set('a', 1);
  const bumpsAfterAdd = h.structureBumps;

  map.set('a', 99);

  assert.equal(map.get('a'), 99, 'value is updated in place');
  assert.equal(
    h.structureBumps,
    bumpsAfterAdd,
    'a value update must not invalidate key-set consumers',
  );
});

test('deleting a present key bumps structure; deleting an absent key does not', () => {
  const h = createHarness<number>();
  const map = new TrackedMap<string, number>(h.hooks);

  map.set('a', 1);
  const bumpsBeforeDelete = h.structureBumps;

  assert.equal(map.delete('a'), true);
  assert.equal(h.structureBumps, bumpsBeforeDelete + 1, 'a real removal bumps once');

  assert.equal(map.delete('missing'), false);
  assert.equal(
    h.structureBumps,
    bumpsBeforeDelete + 1,
    'a no-op removal leaves structure untouched',
  );
});

test('keys() reads the structure signal so key-set consumers subscribe to it', () => {
  const h = createHarness<number>();
  const map = new TrackedMap<string, number>(h.hooks);
  map.set('a', 1);

  const readsBefore = h.structureReads;
  map.keys();

  assert.equal(h.structureReads, readsBefore + 1, 'keys() consumes the structure tag');
});
