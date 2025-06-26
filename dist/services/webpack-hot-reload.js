
import { a as _applyDecoratedDescriptor, b as _initializerDefineProperty } from '../_rollupPluginBabelHelpers-ClPBvGFm.js';
import Service, { service } from '@ember/service';
import { getOwner } from '@ember/owner';
import Router from '@ember/routing/route';
import Controller from '@ember/controller';

var _dec, _class, _descriptor;
const ChangeMap = new WeakMap();
function getLatestChange(obj) {
  while (ChangeMap.has(obj)) {
    obj = ChangeMap.get(obj);
  }
  return obj;
}
let modulePrefix;
let podModulePrefix;
if (module.hot) {
  const ModuleMap = new Map();
  window.emberHotReloadPlugin = {
    Resolver: null,
    _accepting: 0,
    changed: {},
    subscribers: [],
    version: 1,
    routerVersion: 1,
    moduleDepCallbacks: {},
    versionMap: {},
    clear(module) {
      this.moduleDepCallbacks[module.id] = {};
    },
    register(module, dep, callback) {
      dep = dep.replace(new RegExp(`^${modulePrefix}/`), './');
      this.moduleDepCallbacks[module.id][dep] = this.moduleDepCallbacks[module.id][dep] || [];
      this.moduleDepCallbacks[module.id][dep].push(callback);
    },
    loadNew(oldModule, newModule) {
      ModuleMap.set(newModule.id, newModule);
      this.versionMap[newModule.id] = newModule.version;
      const entry = Object.entries(this.Resolver.explicitModules).find(([_name, module]) => module.default === oldModule.exports.default);
      if (!entry) return;
      this.Resolver.explicitModules[entry[0]] = newModule.exports;
    },
    __import(moduleUrl) {
      return import(/* @vite-ignore */moduleUrl);
    },
    async canAcceptNew(moduleUrl) {
      this._accepting += 1;
      const m = await this.__import(moduleUrl);
      const module = {
        exports: m,
        id: moduleUrl.split('?')[0].replace(/http:\/\/.*:[^/]*\//, ''),
        version: 0
      };
      this._accepting -= 1;
      if (this._accepting === 0) {
        setTimeout(() => this.notifyNew(), 0);
      }
      const ok = module.id.includes('/routes/') || module.id.includes('/routers/') || module.id.includes('/controllers/') || module.id.includes('/templates/') || module.id.match(/controller\.(js|ts)$/) || module.id.match(/route\.(js|ts|gts)$/);
      if (!ok) {
        return false;
      }
      if (module.id.includes('templates') && module.id.includes('components')) {
        return false;
      }
      if (ModuleMap.get(module.id)) {
        this.changed[module.id] = {
          old: ModuleMap.get(module.id),
          new: module
        };
      } else {
        ModuleMap.set(module.id, module);
      }
      module.version = this.version;
      return true;
    },
    notifyNew() {
      this.version += 1;
      Object.values(this.changed).forEach(change => {
        this.loadNew(change.old, change.new);
        this.subscribers.forEach(fn => fn(change.old, change.new));
      });
      this.changed = {};
    },
    subscribe(fn) {
      this.subscribers.push(fn);
    },
    unsubscribe(fn) {
      const idx = this.subscribers.indexOf(fn);
      if (idx >= 0) {
        this.subscribers.splice(idx, 1);
      }
    }
  };
}
let WebpackHotReload = (_dec = service(), _class = class WebpackHotReload extends Service {
  constructor(...args) {
    super(...args);
    _initializerDefineProperty(this, "router", _descriptor, this);
    if (!window.emberHotReloadPlugin) return;
    const app = getOwner(this).application;
    window.emberHotReloadPlugin.Resolver = app.Resolver;
    modulePrefix = app.modulePrefix;
    podModulePrefix = app.podModulePrefix;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.router._router;
    // eslint-disable-next-line ember/no-private-routing-service
    Object.defineProperty(this.router._router, '_routerMicrolib', {
      set(v) {
        const getRoute = v.getRoute;
        v.getRoute = function (name) {
          const route = getRoute.call(this, `${name}--hot-version--${window.emberHotReloadPlugin.routerVersion}`);
          route.fullRouteName = `route:${name}`.replace(/--hot-version--.*$/, '');
          return route;
        };
        this.___routerMicrolib = v;
      },
      get() {
        return this.___routerMicrolib;
      }
    });
    this.container = getOwner(this)?.__container__;
    window.emberHotReloadPlugin.subscribe((oldModule, _newModule) => {
      let changed = false;
      if (oldModule.exports.default?.prototype && oldModule.exports.default.prototype instanceof Router) {
        changed = true;
      }
      if (oldModule.exports.default?.prototype && oldModule.exports.default.prototype instanceof Controller) {
        changed = true;
      }
      if (oldModule.id.startsWith('app/templates/') && !oldModule.id.startsWith('app/templates/components/')) {
        changed = true;
      }
      if (oldModule.id.startsWith(`./${podModulePrefix}/`)) {
        changed = true;
      }
      if (!changed) return;
      window.emberHotReloadPlugin.routerVersion += 1;
      const types = ['route', 'controller', 'template', 'modifier', 'helper', 'component'];
      Object.keys(this.container.cache).forEach(k => {
        if (types.some(t => k.startsWith(`${t}:`))) {
          delete this.container.cache[k];
        }
      });
      Object.keys(this.container.factoryManagerCache).forEach(k => {
        if (types.some(t => k.startsWith(`${t}:`))) {
          delete this.container.factoryManagerCache[k];
        }
      });
      Object.keys(this.container.registry._resolveCache).forEach(k => {
        if (types.some(t => k.startsWith(`${t}:`))) {
          delete this.container.registry._resolveCache[k];
        }
      });
      Object.keys(this.container.validationCache).forEach(k => {
        if (types.some(t => k.startsWith(`${t}:`))) {
          delete this.container.validationCache[k];
        }
      });
      Object.keys(this.container.registry.registrations).forEach(k => {
        if (types.some(t => k.startsWith(`${t}:`))) {
          delete this.container.registry.registrations[k];
        }
      });
      if (oldModule.exports.default?.prototype && oldModule.exports.default.prototype instanceof Router) {
        this.router.refresh();
      }
      if (oldModule.exports.default?.prototype && oldModule.exports.default.prototype instanceof Controller) {
        this.router.refresh();
      }
      if (oldModule.id.startsWith('app/templates/') && !oldModule.id.startsWith('app/templates/components/')) {
        this.router.refresh();
      }
      if (oldModule.id.startsWith(`./${podModulePrefix}/`)) {
        this.router.refresh();
      }
    });
  }
  getLatestChange(obj) {
    return getLatestChange(obj);
  }
}, _descriptor = _applyDecoratedDescriptor(_class.prototype, "router", [_dec], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _class);
// this service using `Owner.lookup('service:hot-reload')`, as well
// as to check when you pass the service name as an argument to the decorator,
// like `@service('hot-reload') declare altName: HotReloadService;`.

export { WebpackHotReload as default };
//# sourceMappingURL=webpack-hot-reload.js.map
