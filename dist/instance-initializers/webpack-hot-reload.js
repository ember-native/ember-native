
function patchResolver(application) {
  application.__container__.lookup('service:vite-hot-reload');
  const resolver = application.__registry__.resolver?._fallback || (application.__registry__.fallback?.resolver)._fallback || application.__registry__.fallback?.resolver || application.__registry__.resolver;
  const resolverResolve = resolver.resolve;
  resolver.resolve = function (name) {
    name = name.replace(/--hot-version--.*$/, '');
    return resolverResolve.call(this, name);
  };
}
function initialize(application) {
  patchResolver(application);
}
var webpackHotReload = {
  initialize
};

export { webpackHotReload as default, initialize };
//# sourceMappingURL=webpack-hot-reload.js.map
