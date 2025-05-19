import { S as Service, b as assert, c as Selected, D as DocsService$1, d as Compiler } from './main-BmyRaW_o.js';
export { A as APIDocs, e as CommentQuery, j as Compiled, h as ComponentSignature, H as HelperSignature, M as ModifierSignature, i as addRoutes, k as getIndexPage, l as isCollection, m as isIndex } from './main-BmyRaW_o.js';

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
