/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { removeActionBarChild, type ActionBarLike } from './action-item-removal.ts';

// Mirrors the real shape of @nativescript/core's ActionItems.removeItem(),
// which throws "Cannot find item to remove" for anything it never added -
// see action-bar-common.js. This keeps the fake honest about what a real
// misuse (removing an item ActionItems never registered) would do.
function createFakeActionBar(initialItems: string[]): {
  actionBar: ActionBarLike<string>;
  items: string[];
  removedViaActionItems: string[];
  removedViaGenericView: string[];
} {
  const items = initialItems.slice();
  const removedViaActionItems: string[] = [];
  const removedViaGenericView: string[] = [];

  const actionBar: ActionBarLike<string> = {
    actionItems: {
      getItems: () => items.slice(),
      removeItem: (item) => {
        const index = items.indexOf(item);
        if (index < 0) {
          throw new Error('Cannot find item to remove');
        }
        items.splice(index, 1);
        removedViaActionItems.push(item);
      },
    },
    _removeView: (item) => {
      removedViaGenericView.push(item);
    },
  };

  return { actionBar, items, removedViaActionItems, removedViaGenericView };
}

test('removes a registered action item through ActionItems.removeItem, not the generic _removeView', () => {
  const { actionBar, items, removedViaActionItems, removedViaGenericView } =
    createFakeActionBar(['settings']);

  removeActionBarChild(actionBar, 'settings');

  assert.deepEqual(items, [], 'item should be gone from ActionItems bookkeeping');
  assert.deepEqual(removedViaActionItems, ['settings']);
  assert.deepEqual(
    removedViaGenericView,
    [],
    'must not fall back to the generic path once ActionItems handled it',
  );
});

test('falls back to the generic _removeView for an item ActionItems never registered', () => {
  const { actionBar, removedViaActionItems, removedViaGenericView } = createFakeActionBar([]);

  removeActionBarChild(actionBar, 'nav-button');

  assert.deepEqual(removedViaActionItems, []);
  assert.deepEqual(removedViaGenericView, ['nav-button']);
});

test('a remove -> re-add cycle leaves exactly one entry, not a duplicate', () => {
  const { actionBar, items } = createFakeActionBar(['settings']);

  removeActionBarChild(actionBar, 'settings');
  assert.deepEqual(items, []);

  // Simulate the re-add path (ActionBar._addChildFromBuilder ->
  // actionItems.addItem()) landing the item back in the same bookkeeping
  // array removeActionBarChild reads from.
  items.push('settings');
  assert.deepEqual(items, ['settings']);

  removeActionBarChild(actionBar, 'settings');
  assert.deepEqual(items, [], 'no leftover duplicate after a second removal');
});
