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
    assert.equal(this.element.textContent.trim(), 'counter:  0');

    state.counter += 1;

    await rerender();
    assert.equal(this.element.textContent.trim(), 'counter:  1');
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

  // Regression test for a reported timing bug: a consumer's tests had to read
  // `getAttribute('text')` instead of `.textContent` right after tapping a native
  // element, because `.textContent` was observed to intermittently read back stale
  // (empty) text on a CI emulator. `click()` already awaits `settled()`, so if a
  // native tap's resulting text update were deferred past that (a microtask, a
  // native layout pass, etc.) this test would catch it.
  //
  // Uses a `<label>` whose `text` is a dynamic *attribute* binding, not a child
  // `TextNode`: a child-`TextNode` case (e.g. `<button>counter: {{...}}</button>`,
  // see the tests above) reads `TextNode`'s own plain `.text` field either way and
  // wouldn't distinguish this from the bug fixed in #405 (`textContent` reading a
  // native element's always-`undefined` plain `.text` field instead of going
  // through `getAttribute`, which reflects the real native view property) - only
  // an attribute-bound native element forces the read through
  // `NativeElementNode#getAttribute` -> `nativeView.text`.
  QUnit.test('textContent reflects an attribute-bound text change caused by a native tap, immediately after click() resolves', async function(this: RenderingTestContext, assert) {
    class State {
      @tracked label = 'off';
    };

    const state = new State();
    const toggle = () => {
      state.label = state.label === 'off' ? 'on' : 'off';
    };
    await render(<template><button {{on 'tap' toggle}}>toggle</button><label text={{state.label}} /></template>);
    assert.equal(this.element.textContent.trim(), 'toggle off');

    await click('button');
    assert.equal(this.element.textContent.trim(), 'toggle on');
  });
});
