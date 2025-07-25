import Ember from 'ember';
// These imports have type issues but are needed for the inspector
// @ts-ignore
import * as runtime from '@glimmer/runtime';
// @ts-ignore
import * as reference from '@glimmer/reference';
// @ts-ignore
import * as tracking from '@glimmer/tracking';
// @ts-ignore
import * as validator from '@glimmer/validator';
import { RSVP } from '@ember/-internals/runtime';

import config from './config/environment';

// Define window.define to avoid TypeScript errors
declare global {
  interface Window {
    define: (moduleName: string, factory: () => unknown) => void;
  }
}

// Type assertions for window.define calls
window.define('@glimmer/tracking', () => tracking);
window.define('@glimmer/reference', () => reference);
window.define('@glimmer/runtime', () => runtime);
window.define('@glimmer/validator', () => validator);
window.define('rsvp', () => RSVP);
window.define('ember', () => ({ default: Ember }));
window.define('doc-app/config/environment', () => ({
  default: config,
}));
