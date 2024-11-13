import ApplicationInstance from '@ember/application/instance';
import type HistoryService from '../services/history.ts';

const Initializer = {
  name: 'game-events',
  after: [],

  initialize(application: ApplicationInstance) {
    const history = application.lookup(
      'service:ember-native/history',
    ) as HistoryService;
    history.setup();
  },
};
export default Initializer;
