import { setupRenderingTest } from '~/tests/helpers';
import { render, rerender } from '@ember/test-helpers';
import { RenderingTestContext } from '@ember/test-helpers/setup-rendering-context';
import Component from '@glimmer/component';
import PageStack from 'ember-native/page-stack';
import { PageStackView } from 'ember-native/components/index';
import type ViewNode from 'ember-native/dom/nodes/ViewNode';

let stepOneConstructCount = 0;
let stepTwoConstructCount = 0;

interface StepSignature {
  Args: { isActive: boolean };
}

class StepOne extends Component<StepSignature> {
  constructor(...args: ConstructorParameters<typeof Component<StepSignature>>) {
    super(...args);
    stepOneConstructCount++;
  }
  <template>
    <stack-layout visibility={{if @isActive 'visible' 'collapse'}}>
      <label id='step-one'>step one</label>
    </stack-layout>
  </template>
}

class StepTwo extends Component<StepSignature> {
  constructor(...args: ConstructorParameters<typeof Component<StepSignature>>) {
    super(...args);
    stepTwoConstructCount++;
  }
  <template>
    <stack-layout visibility={{if @isActive 'visible' 'collapse'}}>
      <label id='step-two'>step two</label>
    </stack-layout>
  </template>
}

// Regression coverage for the manual `PageStack`/`PageStackView` primitive
// documented in the README's "Manual stacks" section - unlike router-driven
// navigation (see `FrameElement`/`FrameOutlet`), this is for navigation
// that isn't driven by the Ember router (wizards, master/detail within one
// route), so it still keeps every pushed entry mounted side by side and
// toggles `visibility` rather than driving a real `Frame` backstack.
// Nothing else in this app exercises it, and this repo's own history is
// that inspection-clean `.gts` code has repeatedly failed real on-device CI
// in ways local glint/eslint never catch.
QUnit.module('Unit | PageStack', function (hooks) {
  setupRenderingTest(hooks);

  QUnit.test(
    'push/pop toggle visibility without destroying/re-creating either entry',
    async function (this: RenderingTestContext, assert) {
      const stack = new PageStack();

      await render(<template><PageStackView @stack={{stack}} /></template>);
      const root = this.element as unknown as ViewNode;
      assert.notOk(
        root.getElementById('step-one'),
        'nothing rendered before anything is pushed',
      );

      stack.push(StepOne, 'one');
      await rerender();
      assert.equal(stepOneConstructCount, 1, 'StepOne constructed once');
      assert.equal(
        root.getElementById('step-one')?.parentNode?.getAttribute('visibility'),
        'visible',
        'the only entry is visible',
      );

      stack.push(StepTwo, 'two');
      await rerender();
      assert.equal(stepTwoConstructCount, 1, 'StepTwo constructed once');
      assert.equal(
        root.getElementById('step-one')?.parentNode?.getAttribute('visibility'),
        'collapse',
        'step one is collapsed, not removed, once step two is active',
      );
      assert.equal(
        root.getElementById('step-two')?.parentNode?.getAttribute('visibility'),
        'visible',
        'step two is visible',
      );

      stack.pop();
      await rerender();
      assert.equal(
        root.getElementById('step-one')?.parentNode?.getAttribute('visibility'),
        'visible',
        'step one is visible again after pop()',
      );
      assert.equal(
        root.getElementById('step-two')?.parentNode?.getAttribute('visibility'),
        'collapse',
        'step two is collapsed, not removed, after pop()',
      );
      assert.equal(
        stepOneConstructCount,
        1,
        'step one was never re-constructed across the whole push/push/pop sequence',
      );
      assert.equal(
        stepTwoConstructCount,
        1,
        'step two was never re-constructed by pop() collapsing it',
      );
    },
  );
});
