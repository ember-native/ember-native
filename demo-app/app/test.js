// Import order matters here: the qunit browser shim must run first (see its
// own comment), and ember-native's setup must run before the test helper.
import './tests/qunit-browser-shim';
import 'qunit';
import './native/setup-ember-native';
import './tests/test-helper';
