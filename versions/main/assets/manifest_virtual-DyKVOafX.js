const load = async () => {
  let request = await fetch('/ember-native/versions/main/kolay-manifest/manifest.json', {
    headers: {
      Accept: 'application/json',
    },
  });
  let json = await request.json();
  return json;
};

export { load };
