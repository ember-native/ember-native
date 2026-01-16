# ember-native

With `ember-native` you can use the power of ember with Nativescript

some highlights are:

- list view
- rad list view
- ember transitions with native animations
- glint
- ember inspector

create new app by using the template from

https://github.com/ember-native/ember-native-demo

<Callout>
  note that currently only v2 addons are supported and they need some custom setup to make services,initializers,routes, templates work.
  you need to include following code into the app.js. examples are included in the demo app.
  
```js
  context = require.context(
  '../node_modules/ember-routable-component/dist/_app_',
  true,
  /^\.\/.*\.(js|ts|gjs|gts|hbs)$/,
  'sync'
);
context.keys().forEach((key) => (modules[pkgName + key.slice(1).replace(/\.(ts|js|gts|gjs|hbs)$/, '')] = context(key)));
```

</Callout>
