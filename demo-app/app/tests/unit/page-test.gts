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

        console.error('[debug] App.rootElement === frameEl:', App.rootElement === (frameEl as any));
        console.error('[debug] frameEl.nativeView.constructor.name:', (frameEl as any).nativeView?.constructor?.name);

        await render(<template>
            <page>
                <action-bar title="Test Page"></action-bar>
                <stack-layout>
                    <label>hello page</label>
                </stack-layout>
            </page>
        </template>);

        const docPage = (document as any).page;
        console.error('[debug] document.page tagName:', docPage?.tagName);
        console.error('[debug] document.page.nativeView.parent constructor:', docPage?.nativeView?.parent?.constructor?.name);
        console.error('[debug] frameEl childNodes tagNames:', (frameEl as any).childNodes?.map((n: any) => n.tagName));
        console.error('[debug] frameEl.nativeView.currentPage === docPage.nativeView:', (frameEl as any).nativeView?.currentPage === docPage?.nativeView);
        console.error('[debug] this.element:', this.element?.constructor?.name, (this.element as any)?.tagName);

        const page = docPage?.nativeView;
        assert.ok(page?.frame, 'page has a frame');
        assert.equal(typeof page?.frame?._getNavBarVisible, 'function', 'frame is a real Frame instance');
        assert.equal(this.element.textContent.trim(), 'hello page');
    });
});
