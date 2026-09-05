import { setupRenderingTest } from '~/tests/helpers';
import { render, rerender } from '@ember/test-helpers';
import { RenderingTestContext } from '@ember/test-helpers/setup-rendering-context';
import { tracked } from '@glimmer/tracking';
import { pageTransition } from 'ember-native/modifiers/index';
import type ViewNode from 'ember-native/dom/nodes/ViewNode';
import type { View } from '@nativescript/core';

// Regression coverage for the `{{pageTransition}}` modifier
// (`src/modifiers/page-transition.ts`) itself - `page-transition.test.ts`
// (a `node --test`) only ever exercised `applyPageTransition` against a
// hand-rolled plain object, never the modifier, so nothing pinned that a
// real `NativeElementNode`'s `nativeView` is actually populated at
// modifier-install time, or the `mounted` WeakSet's first-call (no
// animation) vs. later-call (animated) branch selection.
//
// `settled()`/`rerender()` don't wait for the native fade-in animation
// itself to finish (see the README's "Animating the transition" section),
// so these assertions stick to the synchronous state `applyPageTransition`
// sets before `animate()` is even called, and replace `nativeView.animate`
// with a recorder instead of letting a real animation run and race the
// assertions.
QUnit.module('Modifiers | pageTransition', function (hooks) {
  setupRenderingTest(hooks);

  QUnit.test(
    'fades a page in on activation, collapses instantly on deactivation, with no animation on first render',
    async function (this: RenderingTestContext, assert) {
      class State {
        @tracked isActive = true;
      }
      const state = new State();

      await render(
        <template>
          <stack-layout id="target" {{pageTransition state.isActive}}></stack-layout>
        </template>
      );

      const target = (this.element as unknown as ViewNode).getElementById('target') as unknown as {
        nativeView: View;
      };
      const nativeView = target.nativeView;
      assert.ok(
        nativeView,
        'the modifier ran against a real NativeElementNode with a populated nativeView, not the element.nativeView early-return'
      );

      // First render (isActive=true): the `mounted` WeakSet's first-call
      // branch applies the initial state directly, with no animation.
      assert.equal(nativeView.opacity, 1, 'no fade-in on the very first render');
      assert.equal(nativeView.visibility, 'visible');

      const animateCalls: { opacity: number; duration: number }[] = [];
      nativeView.animate = ((options: { opacity: number; duration: number }) => {
        animateCalls.push(options);
        const promise = Promise.resolve() as Promise<void> & {
          cancel?: () => void;
        };
        promise.cancel = () => {};
        return promise;
      }) as View['animate'];

      // Deactivating collapses instantly - never animated, on first render
      // or any later one.
      state.isActive = false;
      await rerender();
      assert.equal(nativeView.visibility, 'collapse');
      assert.deepEqual(animateCalls, [], 'deactivating never animates');

      // Reactivating after mount fades in from transparent, using the
      // default duration.
      state.isActive = true;
      await rerender();
      assert.equal(nativeView.opacity, 0, 'opacity is reset before the fade-in starts');
      assert.equal(nativeView.visibility, 'visible');
      assert.deepEqual(
        animateCalls,
        [{ opacity: 1, duration: 200 }],
        'fades in with the default 200ms duration'
      );
    }
  );

  QUnit.test(
    'an explicit duration overrides the default',
    async function (this: RenderingTestContext, assert) {
      class State {
        @tracked isActive = false;
      }
      const state = new State();

      await render(
        <template>
          <stack-layout id="target" {{pageTransition state.isActive duration=500}}></stack-layout>
        </template>
      );

      const target = (this.element as unknown as ViewNode).getElementById('target') as unknown as {
        nativeView: View;
      };
      const nativeView = target.nativeView;

      const animateCalls: { opacity: number; duration: number }[] = [];
      nativeView.animate = ((options: { opacity: number; duration: number }) => {
        animateCalls.push(options);
        const promise = Promise.resolve() as Promise<void> & {
          cancel?: () => void;
        };
        promise.cancel = () => {};
        return promise;
      }) as View['animate'];

      state.isActive = true;
      await rerender();
      assert.deepEqual(animateCalls, [{ opacity: 1, duration: 500 }]);
    }
  );
});
