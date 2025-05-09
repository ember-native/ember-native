import { visit, click } from '@ember/test-helpers';
import { setupApplicationTest } from '../helpers';
import ENV from '~/config/env';

QUnit.module('Acceptance | root', function(hooks) {
  setupApplicationTest(hooks, {

  });

  QUnit.test('visiting /login', async function(assert) {
    await visit('/');
    assert.true(ENV.rootElement.getElementByTagName('actionbar').getAttribute('title').includes('Ember Nativescript Examples'));
    assert.true(ENV.rootElement.getElementByTagName('button').textContent.includes('List View'));
  });

  QUnit.test('navigating with link to', async function(assert) {
    await visit('/');
    assert.true(ENV.rootElement.getElementByTagName('actionbar').getAttribute('title').includes('Ember Nativescript Examples'));
    assert.true(ENV.rootElement.getElementByTagName('button').textContent.includes('List View'));
    await click('button');
    assert.true(ENV.rootElement.getElementByTagName('actionbar').getAttribute('title').includes('List View'));
  });
});
