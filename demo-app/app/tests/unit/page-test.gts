import { setupRenderingTest } from "~/tests/helpers";
import { render } from "@ember/test-helpers";
import { RenderingTestContext } from "@ember/test-helpers/setup-rendering-context";
import Component from "@glimmer/component";
import { withTemplateForTest } from "ember-native/test-support/with-template-for-testing";

// A stand-in for a route/screen component whose real template is rooted at
// `<page>`, the way every top-level route in this app is written (see
// `demo-app/app/routes/index.gts`).
class ExamplePage extends Component {
    title = 'Example Page';

    <template>
        <page>
            <action-bar title={{this.title}}></action-bar>
            <stack-layout>
                <label>hello page</label>
            </stack-layout>
        </page>
    </template>
}

QUnit.module('Basics | page rendering', function(hooks) {
    setupRenderingTest(hooks);

    QUnit.test('renders the content of a <page>-rooted component via withTemplateForTest', async function(this: RenderingTestContext, assert) {
        // `<page>` needs a real NativeScript `Frame` as its direct native
        // parent to work correctly (see README "Testing page-rooted
        // components") - `setupRenderingTest` doesn't provide one, so render
        // a test-only double with the `<page>`/`<action-bar>` wrapper
        // stripped out, keeping the rest of `ExamplePage` (services, args,
        // lifecycle) intact.
        const TestableExamplePage = withTemplateForTest(ExamplePage, <template>
            <stack-layout>
                <label>hello page</label>
            </stack-layout>
        </template>);

        await render(<template><TestableExamplePage /></template>);
        assert.equal(this.element.textContent.trim(), 'hello page');
    });
});
