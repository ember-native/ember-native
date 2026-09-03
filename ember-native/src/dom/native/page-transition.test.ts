/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPageTransition,
  type AnimatableViewLike,
} from './page-transition.ts';

function createFakeView(): AnimatableViewLike & {
  animateCalls: { opacity: number; duration: number }[];
} {
  const animateCalls: { opacity: number; duration: number }[] = [];
  return {
    opacity: 1,
    visibility: 'visible',
    animateCalls,
    animate(options) {
      animateCalls.push(options);
      return Promise.resolve();
    },
  };
}

test('applies the initial state directly, with no animation', () => {
  const active = createFakeView();
  applyPageTransition(active, true, false, 200);
  assert.equal(active.visibility, 'visible');
  assert.equal(active.opacity, 1);
  assert.deepEqual(active.animateCalls, []);

  const inactive = createFakeView();
  applyPageTransition(inactive, false, false, 200);
  assert.equal(inactive.visibility, 'collapse');
  assert.deepEqual(inactive.animateCalls, []);
});

test('becoming active after mount fades in from transparent', () => {
  const view = createFakeView();
  applyPageTransition(view, true, true, 200);
  assert.equal(view.visibility, 'visible');
  assert.equal(
    view.opacity,
    0,
    'opacity is reset to 0 before the fade-in animation starts',
  );
  assert.deepEqual(view.animateCalls, [{ opacity: 1, duration: 200 }]);
});

test('becoming inactive after mount collapses instantly, without animating', () => {
  const view = createFakeView();
  applyPageTransition(view, false, true, 200);
  assert.equal(view.visibility, 'collapse');
  assert.deepEqual(
    view.animateCalls,
    [],
    'fading the outgoing page out too would leave two pages visible at once',
  );
});

test('a fade-in half-finished by an interruption resolves harmlessly once collapsed', async () => {
  const view = createFakeView();
  let resolveAnimate: () => void = () => {};
  view.animate = (options) => {
    view.animateCalls.push(options);
    return new Promise((resolve) => {
      resolveAnimate = resolve;
    });
  };

  applyPageTransition(view, true, true, 200);
  assert.equal(view.visibility, 'visible');

  // Navigated away again before the fade-in animation ever resolved.
  applyPageTransition(view, false, true, 200);
  assert.equal(view.visibility, 'collapse');

  resolveAnimate();
  await Promise.resolve();
  assert.equal(
    view.visibility,
    'collapse',
    'the stale fade-in has nothing left to apply on resolve',
  );
});
