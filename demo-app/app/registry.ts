import RouteableComponentTemmplate from 'ember-routable-component/templates/ember-routable-component/ember-route-template';
/* imported routes */


// ember-data debug adapter
// import DataDebugAdapter from '@ember-data/debug';
// import StoreService from '../services/store';
// /* ember-data stuff */
// import Pet from '@/models/pet';
// import Person from '@/models/person';

const InitialRegistry = {
  // 'service:store': StoreService,
  // 'model:pet': Pet,
  // 'model:person': Person,
  // // debug ember-data adapter
  // 'data-adapter:main': DataDebugAdapter,

  // 'authenticator:custom': CustomAuthenticator,
  // 'service:date': DateService,
  // 'controller:application': ApplicationController,
  // 'controller:login': LoginController,
  // 'route:application': ApplicationRoute,
  // 'route:test': TestRoute,
  // 'route:login': LoginRoute,
  // 'route:logout': LogoutRoute,
  'template:ember-routable-component/ember-route-template': RouteableComponentTemmplate,
};

function registry(): IRegistry {
  return InitialRegistry;
}

export default registry;
