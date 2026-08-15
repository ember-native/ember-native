import { setupRenderingTest } from "~/tests/helpers";
import { render } from "@ember/test-helpers";
import { RenderingTestContext } from "@ember/test-helpers/setup-rendering-context";

QUnit.module('Basics | page rendering', function(hooks) {
    setupRenderingTest(hooks);

    QUnit.test('renders a <page>-rooted component', async function(this: RenderingTestContext, assert) {
        await render(<template>
            <page>
                <action-bar title="Test Page"></action-bar>
                <stack-layout>
                    <label>hello page</label>
                </stack-layout>
            </page>
        </template>);
        assert.equal(this.element.textContent.trim(), 'hello page');
    });
});
