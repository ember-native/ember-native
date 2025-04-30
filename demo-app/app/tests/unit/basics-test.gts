import { setupRenderingTest } from "~/tests/helpers";
import {click, render} from "@ember/test-helpers";
import { on } from "@ember/modifier";
import { RenderingTestContext } from "@ember/test-helpers/setup-rendering-context";

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
