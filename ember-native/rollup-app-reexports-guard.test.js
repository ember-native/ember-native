const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeAppReexports } = require('./rollup-app-reexports-guard.js');

// Fixture-matches the real bug: `components/index.js` only has named
// exports (see src/components/index.gts), but addon-dev's appReexports()
// used to unconditionally emit `export { default }` stubs for it.
test('flags a stub that reexports a default export the target module does not have', () => {
  const bundle = {
    '_app_/components/ember-native/index.js': {
      type: 'asset',
      source: 'export { default } from "ember-native/components/index";\n',
    },
    'components/index.js': {
      type: 'chunk',
      exports: ['ListView', 'RadListView', 'InspectorSupport'],
    },
  };

  const { mismatches, unrecognized } = analyzeAppReexports(bundle, 'ember-native');

  assert.deepEqual(unrecognized, []);
  assert.equal(mismatches.length, 1);
  assert.equal(mismatches[0].fileName, '_app_/components/ember-native/index.js');
  assert.deepEqual(mismatches[0].missing, ['default']);
});

test('does not flag a stub whose reexported name matches the target module', () => {
  const bundle = {
    '_app_/components/ember-native/ListView.js': {
      type: 'asset',
      source: 'export { default } from "ember-native/components/ListView";\n',
    },
    'components/ListView.js': {
      type: 'chunk',
      exports: ['default'],
    },
  };

  const { mismatches, unrecognized } = analyzeAppReexports(bundle, 'ember-native');

  assert.deepEqual(mismatches, []);
  assert.deepEqual(unrecognized, []);
});

test('does not flag a stub reexporting named bindings that do exist on the target', () => {
  const bundle = {
    '_app_/components/ember-native/index.js': {
      type: 'asset',
      source: 'export { ListView, RadListView } from "ember-native/components/index";\n',
    },
    'components/index.js': {
      type: 'chunk',
      exports: ['ListView', 'RadListView'],
    },
  };

  const { mismatches, unrecognized } = analyzeAppReexports(bundle, 'ember-native');

  assert.deepEqual(mismatches, []);
  assert.deepEqual(unrecognized, []);
});

test('ignores non-_app_ assets and non-asset bundle entries', () => {
  const bundle = {
    'components/index.js': { type: 'chunk', exports: ['ListView'] },
  };

  const { mismatches, unrecognized } = analyzeAppReexports(bundle, 'ember-native');

  assert.deepEqual(mismatches, []);
  assert.deepEqual(unrecognized, []);
});

// Fails closed rather than silently passing: every "can't figure out this
// stub" branch is treated as a build-breaking finding, not an ignorable
// case, because in a real build every `_app_` stub's target is guaranteed
// to be a key in the same bundle - see analyzeAppReexports' docstring.
test('flags an _app_ stub whose target chunk cannot be resolved in the bundle', () => {
  const bundle = {
    '_app_/components/ember-native/orphan.js': {
      type: 'asset',
      source: 'export { default } from "ember-native/components/orphan";\n',
    },
  };

  const { mismatches, unrecognized } = analyzeAppReexports(bundle, 'ember-native');

  assert.deepEqual(mismatches, []);
  assert.equal(unrecognized.length, 1);
  assert.equal(unrecognized[0].fileName, '_app_/components/ember-native/orphan.js');
});

test('flags an _app_ stub whose source does not match the expected addon-dev output shape', () => {
  const bundle = {
    '_app_/components/ember-native/weird.js': {
      type: 'asset',
      source: '// not a reexport stub at all\n',
    },
  };

  const { mismatches, unrecognized } = analyzeAppReexports(bundle, 'ember-native');

  assert.deepEqual(mismatches, []);
  assert.equal(unrecognized.length, 1);
  assert.equal(unrecognized[0].fileName, '_app_/components/ember-native/weird.js');
});
