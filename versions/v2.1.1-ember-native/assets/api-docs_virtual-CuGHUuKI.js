const packageNames = [
  'ember-native',
];

const loadApiDocs = {
  'ember-native': () => fetch('/ember-native/versions/v2.1.1-ember-native/docs/ember-native.json'),
};

export { loadApiDocs, packageNames };
