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
      const promise = Promise.resolve() as Promise<void> & {
        cancel?: () => void;
      };
      promise.cancel = () => {};
      return promise;
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

test('active -> inactive -> active before the first fade-in resolves cancels the stale animation', () => {
  const view = createFakeView();
  let cancelled = false;
  view.animate = (options) => {
    view.animateCalls.push(options);
    const promise = new Promise<void>(() => {}) as Promise<void> & {
      cancel?: () => void;
    };
    promise.cancel = () => {
      cancelled = true;
    };
    return promise;
  };

  applyPageTransition(view, true, true, 200);
  assert.equal(cancelled, false, 'nothing to cancel on the first activation');

  applyPageTransition(view, false, true, 200);
  applyPageTransition(view, true, true, 200);
  assert.equal(
    cancelled,
    true,
    'the still-running first fade-in is cancelled before the second one starts',
  );
  assert.equal(
    view.animateCalls.length,
    2,
    'both fade-ins were requested, one cancelled and one left running',
  );
});

test('a fade-in that already finished is not spuriously cancelled by a later activation', async () => {
  const view = createFakeView();
  let cancelCalls = 0;
  view.animate = (options) => {
    view.animateCalls.push(options);
    const promise = Promise.resolve() as Promise<void> & {
      cancel?: () => void;
    };
    promise.cancel = () => {
      cancelCalls++;
    };
    return promise;
  };

  applyPageTransition(view, true, true, 200);
  // Let the fade-in's own `.then()` cleanup (clearing its tracked entry once
  // it resolves) run before navigating away and back.
  await Promise.resolve();
  await Promise.resolve();

  applyPageTransition(view, false, true, 200);
  applyPageTransition(view, true, true, 200);

  assert.equal(
    cancelCalls,
    0,
    'the first fade-in already finished, so there is nothing left to cancel',
  );
});
