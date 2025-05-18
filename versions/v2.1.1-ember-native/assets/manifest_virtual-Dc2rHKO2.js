const load = async () => {
  let request = await fetch('/ember-native/versions/v2.1.1-ember-native/kolay-manifest/manifest.json', {
    headers: {
      Accept: 'application/json',
    },
  });
  let json = await request.json();
  return json;
};

export { load };
