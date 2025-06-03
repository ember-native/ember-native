
const Initializer = {
  name: 'game-events',
  after: [],
  initialize(application) {
    const history = application.lookup('service:ember-native/history');
    history.setup();
  }
};

export { Initializer as default };
//# sourceMappingURL=history.js.map
