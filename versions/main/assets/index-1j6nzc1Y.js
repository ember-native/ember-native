import { S as Selected, D as DocsService, b as Compiler, c as DocsService$1 } from './main-BsabAuKH.js';
export { A as APIDocs, d as CommentQuery, h as Compiled, e as ComponentSignature, H as HelperSignature, M as ModifierSignature, g as addRoutes, i as getIndexPage, j as isCollection, k as isIndex } from './main-BsabAuKH.js';

function registry(prefix) {
  return {
    [`${prefix}/services/kolay/api-docs`]: DocsService$1,
    [`${prefix}/services/kolay/compiler`]: Compiler,
    [`${prefix}/services/kolay/docs`]: DocsService,
    [`${prefix}/services/kolay/selected`]: Selected
  };
}

export { registry };
