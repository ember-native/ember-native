import Service, { service } from '@ember/service';
import { getOwner } from '@ember/owner';
import RouterService from '@ember/routing/router-service';
import Router from '@ember/routing/route';
import Controller from '@ember/controller';
import ApplicationInstance from '@ember/application/instance';

type Module = any;
type AnyFunction = (...args: any) => any;

const ChangeMap = new WeakMap();

function getLatestChange(obj: any) {
  while (ChangeMap.has(obj)) {
    obj = ChangeMap.get(obj);
  }
  return obj;
}

let modulePrefix!: string;
let podModulePrefix!: string;
if ((module as any).hot) {
  const ModuleMap = new Map();

  (window as any).emberHotReloadPlugin = {
    Resolver: null,
    _accepting: 0,
    changed: {},
    subscribers: [],
    version: 1,
    routerVersion: 1,
    moduleDepCallbacks: {},
    versionMap: {},

    clear(module: Module) {
      this.moduleDepCallbacks[module.id] = {};
    },
    register(module: Module, dep: string, callback: AnyFunction) {
      dep = dep.replace(new RegExp(`^${modulePrefix}/`), './');
      this.moduleDepCallbacks[module.id]![dep] =
        this.moduleDepCallbacks[module.id]![dep] || ([] as AnyFunction[]);
      this.moduleDepCallbacks[module.id]![dep]!.push(callback);
    },
    loadNew(oldModule: Module, newModule: Module) {
      ModuleMap.set(newModule.id, newModule);
      this.versionMap[newModule.id] = newModule.version;
      const entry = Object.entries(
        this.Resolver.explicitModules as Record<string, any>,
      ).find(([_name, module]) => module.default === oldModule.exports.default);
      if (!entry) return;
      this.Resolver.explicitModules[entry[0]] = newModule.exports;
    },

    __import(moduleUrl: string) {
      return import(/* @vite-ignore */ moduleUrl);
    },

    async canAcceptNew(moduleUrl: string) {
      this._accepting += 1;
      const m = await this.__import(moduleUrl);
      const module: Module = {
        exports: m,
        id: moduleUrl.split('?')[0]!.replace(/http:\/\/.*:[^/]*\//, ''),
        version: 0,
      };
      this._accepting -= 1;
      if (this._accepting === 0) {
        setTimeout(() => this.notifyNew(), 0);
      }
      const ok =
        module.id.includes('/routes/') ||
        module.id.includes('/routers/') ||
        module.id.includes('/controllers/') ||
        module.id.includes('/templates/') ||
        module.id.match(/controller\.(js|ts)$/) ||
        module.id.match(/route\.(js|ts|gts)$/);
      if (!ok) {
        return false;
      }

      if (module.id.includes('templates') && module.id.includes('components')) {
        return false;
      }

      if (ModuleMap.get(module.id)) {
        this.changed[module.id] = {
          old: ModuleMap.get(module.id),
          new: module,
        };
      } else {
        ModuleMap.set(module.id, module);
      }
      module.version = this.version;
      return true;
    },
    notifyNew() {
      this.version += 1;
      Object.values(this.changed).forEach((change: any) => {
        this.loadNew(change.old, change.new);
        this.subscribers.forEach((fn: any) => fn(change.old, change.new));
      });
      this.changed = {};
    },
    subscribe(fn: AnyFunction) {
      this.subscribers.push(fn);
    },
    unsubscribe(fn: AnyFunction) {
      const idx = this.subscribers.indexOf(fn);
      if (idx >= 0) {
        this.subscribers.splice(idx, 1);
      }
    },
  };
}

export default class WebpackHotReload extends Service {
  declare container: any;
  @service() router!: RouterService;

  constructor(...args: any) {
    super(...args);
    if (!(window as any).emberHotReloadPlugin) return;
    const app = (getOwner(this) as ApplicationInstance)!.application as any;
    (window as any).emberHotReloadPlugin.Resolver = app.Resolver;
    modulePrefix = app.modulePrefix;
    podModulePrefix = app.podModulePrefix;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.router._router;
    // eslint-disable-next-line ember/no-private-routing-service
    Object.defineProperty(this.router._router, '_routerMicrolib', {
      set(v) {
        const getRoute = v.getRoute;
        v.getRoute = function (name: string) {
          const route = getRoute.call(
            this,
            `${name}--hot-version--${(window as any).emberHotReloadPlugin.routerVersion}`,
          );
          route.fullRouteName = `route:${name}`.replace(
            /--hot-version--.*$/,
            '',
          );
          return route;
        };
        this.___routerMicrolib = v;
      },
      get() {
        return this.___routerMicrolib;
      },
    });
    this.container = (getOwner(this) as any)?.__container__;
    (window as any).emberHotReloadPlugin.subscribe(
      (oldModule: any, _newModule: any) => {
        let changed = false;
        if (
          oldModule.exports.default?.prototype &&
          oldModule.exports.default.prototype instanceof Router
        ) {
          changed = true;
        }
        if (
          oldModule.exports.default?.prototype &&
          oldModule.exports.default.prototype instanceof Controller
        ) {
          changed = true;
        }
        if (
          oldModule.id.startsWith('app/templates/') &&
          !oldModule.id.startsWith('app/templates/components/')
        ) {
          changed = true;
        }
        if (oldModule.id.startsWith(`./${podModulePrefix}/`)) {
          changed = true;
        }
        if (!changed) return;
        (window as any).emberHotReloadPlugin.routerVersion += 1;
        const types = [
          'route',
          'controller',
          'template',
          'modifier',
          'helper',
          'component',
        ];
        Object.keys(this.container.cache).forEach((k) => {
          if (types.some((t) => k.startsWith(`${t}:`))) {
            delete this.container.cache[k];
          }
        });
        Object.keys(this.container.factoryManagerCache).forEach((k) => {
          if (types.some((t) => k.startsWith(`${t}:`))) {
            delete this.container.factoryManagerCache[k];
          }
        });
        Object.keys(this.container.registry._resolveCache).forEach((k) => {
          if (types.some((t) => k.startsWith(`${t}:`))) {
            delete this.container.registry._resolveCache[k];
          }
        });
        Object.keys(this.container.validationCache).forEach((k) => {
          if (types.some((t) => k.startsWith(`${t}:`))) {
            delete this.container.validationCache[k];
          }
        });
        Object.keys(this.container.registry.registrations).forEach((k) => {
          if (types.some((t) => k.startsWith(`${t}:`))) {
            delete this.container.registry.registrations[k];
          }
        });
        if (
          oldModule.exports.default?.prototype &&
          oldModule.exports.default.prototype instanceof Router
        ) {
          this.router.refresh();
        }
        if (
          oldModule.exports.default?.prototype &&
          oldModule.exports.default.prototype instanceof Controller
        ) {
          this.router.refresh();
        }
        if (
          oldModule.id.startsWith('app/templates/') &&
          !oldModule.id.startsWith('app/templates/components/')
        ) {
          this.router.refresh();
        }
        if (oldModule.id.startsWith(`./${podModulePrefix}/`)) {
          this.router.refresh();
        }
      },
    );
  }
  getLatestChange(obj: any) {
    return getLatestChange(obj);
  }
}

// Don't remove this declaration: this is what enables TypeScript to resolve
// this service using `Owner.lookup('service:hot-reload')`, as well
// as to check when you pass the service name as an argument to the decorator,
// like `@service('hot-reload') declare altName: HotReloadService;`.
declare module '@ember/service' {
  interface Registry {
    'hot-reload': WebpackHotReload;
  }
}
