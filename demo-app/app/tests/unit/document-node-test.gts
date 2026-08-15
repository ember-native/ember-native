import { setupRenderingTest } from '~/tests/helpers';
import { render } from '@ember/test-helpers';
import { RenderingTestContext } from '@ember/test-helpers/setup-rendering-context';
import DocumentNode from 'ember-native/dom/nodes/DocumentNode';

// Regression coverage for consumer apps having to hand-write a `document`
// shim (patching `getElementsByTagName`/`querySelector`/`createElement`)
// purely so Vite's dynamic-import module-preload runtime helper doesn't
// crash against ember-native's DocumentNode - even outside a real build,
// since Vite's dev/test runtime probes the same APIs. See
// node_modules/vite/dist/node/chunks/config.js's `preload()`/
// `detectScriptRel()` for the exact sequence this mirrors.
QUnit.module('DocumentNode | browser-DOM compatibility', function (hooks) {
  setupRenderingTest(hooks);

  QUnit.test('getElementsByTagName returns a real array, empty for a tag nothing rendered', async function (this: RenderingTestContext, assert) {
    await render(<template><button>hi</button></template>);

    const document = globalThis.document as unknown as DocumentNode;
    const buttons = document.getElementsByTagName('button');
    assert.ok(Array.isArray(buttons), 'returns a real array, not undefined');
    assert.ok(buttons.length >= 1, 'finds the rendered <button>');

    const links = document.getElementsByTagName('link');
    assert.deepEqual(links, [], 'a tag nothing rendered returns an empty array, not a crash');
  });

  QUnit.test('createElement tolerates browser-only tags (meta, link, title) instead of throwing', function (assert) {
    const document = globalThis.document as unknown as DocumentNode;

    for (const tag of ['meta', 'link', 'title']) {
      // A throw here fails the test on its own - no try/catch needed.
      const el: any = document.createElement(tag);
      assert.equal(typeof el.appendChild, 'function', `createElement('${tag}') returns a node with a real appendChild`);
    }
  });

  QUnit.test("querySelector on document still resolves #id/.class lookups (e.g. @ember/test-helpers' #ember-testing)", async function (this: RenderingTestContext, assert) {
    await render(<template><button id='hello'>hi</button></template>);

    const document = globalThis.document as unknown as DocumentNode;
    assert.equal(document.querySelector('#hello'), document.getElementById('hello'));
  });

  QUnit.test("mirrors Vite's own preload() runtime helper call sequence without crashing", function (assert) {
    const document = globalThis.document as unknown as DocumentNode;

    // detectScriptRel(): `document.createElement("link").relList` - a throw
    // anywhere in this test fails it on its own, no try/catch needed.
    const relList = document.createElement('link').relList;
    assert.notOk(relList, "fake <link> has no relList, so detectScriptRel() falls back to 'preload' instead of throwing");

    // preload(): getElementsByTagName/querySelector for an absent csp nonce meta tag
    const links = document.getElementsByTagName('link');
    assert.deepEqual(links, []);
    const cspNonceMeta = document.querySelector('meta[property=csp-nonce]');
    assert.equal(cspNonceMeta, null, 'an unrelated meta[...] lookup resolves to null, not the app config pseudo-element');

    // preload(): create + append the actual <link rel="modulepreload"> tag
    const link: any = document.createElement('link');
    link.rel = 'modulepreload';
    document.head.appendChild(link);
    assert.ok(true, 'document.head.appendChild(link) does not throw');
  });
});
