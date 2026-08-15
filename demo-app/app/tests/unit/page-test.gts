import { setupRenderingTest } from "~/tests/helpers";
import { render } from "@ember/test-helpers";
import { RenderingTestContext } from "@ember/test-helpers/setup-rendering-context";
import App from "~/native/main";
import { setNextTransition } from "ember-native/dom/native/FrameElement";

QUnit.module('Basics | page rendering', function(hooks) {
    let originalRootElement: any;
    const frameEl = document.createElement('frame');

    hooks.beforeEach(function() {
        originalRootElement = App.rootElement;
        (App.rootElement as any).appendChild(frameEl);
        App.rootElement = frameEl as any;
    });

    setupRenderingTest(hooks);

    hooks.afterEach(function() {
        App.rootElement = originalRootElement;
    });

    QUnit.test('renders a <page>-rooted component with a real Frame parent', async function(this: RenderingTestContext, assert) {
        setNextTransition(undefined, false);
        await render(<template>
            <page>
                <action-bar title="Test Page"></action-bar>
                <stack-layout>
                    <label>hello page</label>
                </stack-layout>
            </page>
        </template>);

        const page = (document as any).page.nativeView;
        assert.ok(page.frame, 'page has a frame');
        assert.equal(typeof page.frame._getNavBarVisible, 'function', 'frame is a real Frame instance');
        assert.equal(this.element.textContent.trim(), 'hello page');
    });
});
