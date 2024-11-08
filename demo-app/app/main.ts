import { setup } from 'ember-native/setup';
import { setupInspectorSupport } from 'ember-native/setup-inspector-support';
import App from  './app';
import { ENV } from  './env';
import Router from './router';
import { init } from './init';

setup();
setupInspectorSupport(ENV);

export default init(App, Router);
