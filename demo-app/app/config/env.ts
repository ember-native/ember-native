import packageJSON from '../../package.json';
import NativeElementNode from 'ember-native/dom/native/NativeElementNode';

function config(environment: 'production' | 'development') {
  const ENV = {
    modulePrefix: packageJSON.name,
    environment,
    rootElement: null as NativeElementNode | null,
    autoboot: false,
    rootURL: '/',
    locationType: 'history', // here is the change
    EmberENV: {
      FEATURES: {},
      EXTEND_PROTOTYPES: false,
      _JQUERY_INTEGRATION: false,
      _APPLICATION_TEMPLATE_WRAPPER: false,
      _DEFAULT_ASYNC_OBSERVERS: true,
      _TEMPLATE_ONLY_GLIMMER_COMPONENTS: true,
    },
    APP: {
      version: packageJSON.version,
      globalName: 'MyApp',
    },
  };

  return ENV;
}

const mode = __DEV__ ? 'development' : 'production';

export const ENV = config(mode);
export default ENV;
