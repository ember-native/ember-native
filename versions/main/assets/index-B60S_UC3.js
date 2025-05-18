import { S as Service, l as assert, m as Selected, D as DocsService$1, p as Compiler } from './main-MaTxhs28.js';
export { A as APIDocs, q as CommentQuery, x as Compiled, u as ComponentSignature, H as HelperSignature, M as ModifierSignature, w as addRoutes, y as getIndexPage, z as isCollection, B as isIndex } from './main-MaTxhs28.js';

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
