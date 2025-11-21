import { setupRenderingTest } from "~/tests/helpers";
import { click, render, rerender } from "@ember/test-helpers";
import { on } from "@ember/modifier";
import { RenderingTestContext } from "@ember/test-helpers/setup-rendering-context";
import { tracked } from "@glimmer/tracking";

/**
 *  to get modifier to work app needs to override `buildInstance` to pass isInteractive = true
 *  to get custom rendering we need to pass out custom Document to the app
 *  buildInstance() {
 *     const instance = super.buildInstance();
 *     instance.setupRegistry = (options) => {
 *       options.isInteractive = true;
 *       options.document = globalThis.document;
 *       ApplicationInstance.prototype.setupRegistry.call(instance, options);
 *     }
 *     return instance;
 *   }
 */
QUnit.module('Basics | rendering & modifier', function(hooks) {
    setupRenderingTest(hooks);

    QUnit.test('renders', async function(this: RenderingTestContext, assert) {
        await render(<template><button>hello world</button></template>);
        assert.equal(this.element.textContent.trim(), 'hello world');
    });

  QUnit.test('text updates work', async function(this: RenderingTestContext, assert) {
    class State {
      @tracked counter = 0;
    };

    const state = new State();
    await render(<template><button>counter: {{state.counter}}</button></template>);
    assert.equal(this.element.textContent.trim(), 'counter: 0');

    state.counter += 1;

    await rerender();
    assert.equal(this.element.textContent.trim(), 'counter: 1');
  });

    QUnit.test('modifier works', async function(assert) {
        let clicked = false;
        const onClick = () => {
            clicked = true;
        }
        await render(<template><button {{on 'tap' onClick}}>hello world</button></template>);
        await click('button');
        assert.equal(clicked, true);
    })
});
