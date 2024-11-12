import './setup-ember-native';
import App from  '../app';
import { init } from './init';
import ENV from "../config/env";

export default init(App, ENV);
