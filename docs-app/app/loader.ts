/* eslint-disable */
// @ts-nocheck

let define = window.define && ((...args) => window.define(...args)),
  exports = undefined,
  module = undefined,
  require = window.requireModule,
  requireModule = window.requireModule;

/* eslint-enable */
if (typeof define !== 'function' || typeof requireModule !== 'function') {
  (function () {
    let registry = {},
      seen = {};

    define = function (name, deps, callback) {
      if (arguments.length < 3) {
        callback = deps;
        deps = [];
      }

      registry[name] = { deps, callback };
    };

    requireModule = function (name) {
      if (seen[name]) {
        return seen[name];
      }

      let mod = registry[name];

      if (!mod) {
        throw new Error(`Module: '${name}' not found.`);
      }

      seen[name] = {};

      let deps = mod.deps;
      let callback = mod.callback;
      let reified = [];
      let exports;

      for (let i = 0, l = deps.length; i < l; i++) {
        if (deps[i] === 'exports') {
          reified.push((exports = {}));
        } else {
          reified.push(requireModule(deps[i]));
        }
      }

      let value = callback.apply(this, reified);

      seen[name] = exports || value;

      return seen[name];
    };

    requireModule.has = function (name) {
      return !!registry[name];
    };

    define.registry = registry;
    define.seen = seen;
  })();
}

export { define, require, requireModule };
