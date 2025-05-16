import { S as Service, x as assert, y as Selected, D as DocsService$1, z as Compiler } from './main-CjWhnG7r.js';
export { A as APIDocs, B as CommentQuery, G as Compiled, E as ComponentSignature, H as HelperSignature, M as ModifierSignature, F as addRoutes, I as getIndexPage, J as isCollection, K as isIndex } from './main-CjWhnG7r.js';

class DocsService extends Service {
  _packages = [];
  loadApiDocs = {};
  get packages() {
    (!(this._packages) && assert(`packages was never set. Did you forget to import 'kolay/api-docs:virtual' and set it to 'apiDocs' when calling docs.setup()?`, this._packages));
    return this._packages;
  }
  load = name => {
    (!(this.loadApiDocs) && assert(`loadApiDocs was never set, did you forget to pass it do docs.setup?`, this.loadApiDocs));
    const loader = this.loadApiDocs[name];
    return loader();
  };
}

function registry(prefix) {
  return {
    [`${prefix}/services/kolay/api-docs`]: DocsService,
    [`${prefix}/services/kolay/compiler`]: Compiler,
    [`${prefix}/services/kolay/docs`]: DocsService$1,
    [`${prefix}/services/kolay/selected`]: Selected
  };
}

export { registry };
