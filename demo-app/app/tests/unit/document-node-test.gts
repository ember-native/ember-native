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

  // `document.getElementsByTagName` only ever needs to search `document`'s
  // own subtree (in practice just `document.head` - a rendering test's
  // actual UI tree is never attached under `document` itself, only under
  // its own detached test-container root), which is exactly what Vite's
  // preload() helper searches too: it only ever looks for `<link>` tags it
  // itself previously created and appended to `document.head`.
  QUnit.test('getElementsByTagName returns a real array, finds elements appended under document.head, empty otherwise', function (assert) {
    const document = globalThis.document as unknown as DocumentNode;

    const link = document.createElement('link');
    document.head.appendChild(link);

    const links = document.getElementsByTagName('link');
    assert.ok(Array.isArray(links), 'returns a real array, not undefined');
    assert.ok(links.includes(link), 'finds the <link> appended under document.head');

    const buttons = document.getElementsByTagName('button');
    assert.deepEqual(buttons, [], 'a tag nothing was appended under document returns an empty array, not a crash');
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
