// Import order here matters - see ./tests/qunit-browser-shim.js for why it
// has to run first, and ./native/setup-ember-native (via `ember-native`'s
// `setup()`) has to run before ./tests/test-helper.
import './tests/qunit-browser-shim';
import 'qunit';
import './native/setup-ember-native';
import './tests/test-helper';
