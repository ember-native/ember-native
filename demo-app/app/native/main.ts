import './setup-ember-native';
import './register-elements';
import App from  '../app';
import ENV from '~/config/env';
import { createNativeApplication } from 'ember-native';

export default createNativeApplication(App, ENV);
