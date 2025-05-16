const packageNames = [
  'ember-native',
];

const loadApiDocs = {
  'ember-native': () => fetch('/ember-native/versions/main/docs/ember-native.json'),
};

export { loadApiDocs, packageNames };
