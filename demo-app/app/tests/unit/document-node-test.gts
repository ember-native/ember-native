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
//
// `document` is a real singleton shared across every test in the whole run
// (see DocumentNode's constructor/`setup()`), not recreated per test - so
// these tests append their own elements under `document.head` and remove
// them again afterwards, rather than asserting exact "nothing else is
// there" counts. They also avoid `assert.deepEqual` on anything that might
// contain an ElementNode: QUnit's own failure-message dumper assumes a
// standard DOM node shape (a `nodeName` string) that ElementNode doesn't
// have (`tagName` only) - confirmed on-device that a *failing* deepEqual on
// such a value crashes QUnit itself ("Cannot read properties of undefined
// (reading 'toLowerCase')" inside QUnit's own `dump.parsers.node`) instead
// of reporting a clean diff.
QUnit.module('DocumentNode | browser-DOM compatibility', function (hooks) {
  setupRenderingTest(hooks);

  QUnit.test('getElementsByTagName returns a real, live-searchable array', function (assert) {
    const document = globalThis.document as unknown as DocumentNode;

    const before = document.getElementsByTagName('link').length;
    const link = document.createElement('link');
    document.head.appendChild(link);
    try {
      const links = document.getElementsByTagName('link');
      assert.ok(Array.isArray(links), 'returns a real array, not undefined');
      assert.equal(links.length, before + 1, 'finds the <link> just appended under document.head');
      assert.ok(links.includes(link), 'the array actually contains the appended element');
    } finally {
      document.head.removeChild(link);
    }

    assert.equal(document.getElementsByTagName('link').length, before, 'removing it again shrinks the result back down');
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
    const before = document.getElementsByTagName('link').length;

    // detectScriptRel(): `document.createElement("link").relList` - a throw
    // anywhere in this test fails it on its own, no try/catch needed.
    const relList = document.createElement('link').relList;
    assert.notOk(relList, "fake <link> has no relList, so detectScriptRel() falls back to 'preload' instead of throwing");

    // preload(): querySelector for an absent csp nonce meta tag
    const cspNonceMeta = document.querySelector('meta[property=csp-nonce]');
    assert.notOk(cspNonceMeta, 'an unrelated meta[...] lookup resolves to a falsy value, not the app config pseudo-element');

    // preload(): create + append the actual <link rel="modulepreload"> tag
    const link: any = document.createElement('link');
    link.rel = 'modulepreload';
    document.head.appendChild(link);
    try {
      assert.equal(
        document.getElementsByTagName('link').length,
        before + 1,
        'document.head.appendChild(link) does not throw and is reflected by getElementsByTagName',
      );
    } finally {
      document.head.removeChild(link);
    }
  });
});
