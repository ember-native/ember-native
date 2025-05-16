const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DUmrJQA6.js","assets/main-DC_2B1Zk.js","assets/main-CTnIdGih.css","assets/plugin-DSr8DBgu.js","assets/_commonjsHelpers-D5KtpA0t.js","assets/index-BecZGZPp.js","assets/babel-85PMSO9b.js"])))=>i.map(i=>d[i]);
import { T as decorateClass, U as decorateFieldV1, V as decorateFieldV2, W as initializeDeferredDecorator, X as decorateMethodV1, Y as decorateMethodV2, Z as decoratePOJO, _ as _tracking, G as GlimmerComponent, E as _owner, a as templateFactory, F as _service, I as _runloop, J as _object, K as _modifier, L as _helpers, N as _destroyable, O as _debug, P as _array, Q as _application, t as templateOnly, n as nameFor, R as __vitePreload } from './main-DC_2B1Zk.js';
import { _ as _template, a as _utils, b as _EmberComponentHelper, c as _EmberComponent, d as _importSync20 } from './ember-template-compiler-MdXyx9il.js';
import './_commonjsHelpers-D5KtpA0t.js';

const _decoratorsRuntime = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  c: decorateClass,
  f: decorateFieldV1,
  g: decorateFieldV2,
  i: initializeDeferredDecorator,
  m: decorateMethodV1,
  n: decorateMethodV2,
  p: decoratePOJO
}, Symbol.toStringTag, { value: 'Module' }));

/**
 * We need to import and hang on to these references so that they
 * don't get optimized away during deploy
 */
const modules = {
  '@ember/application': _application,
  '@ember/array': _array,
  '@ember/component': _EmberComponent,
  '@ember/component/helper': _EmberComponentHelper,
  '@ember/component/template-only': Object.assign(templateOnly, {
    default: templateOnly
  }),
  '@ember/debug': _debug,
  '@ember/destroyable': _destroyable,
  '@ember/helper': _helpers,
  '@ember/modifier': _modifier,
  '@ember/object': _object,
  '@ember/runloop': _runloop,
  '@ember/service': _service,
  '@ember/template-factory': {
    createTemplateFactory: templateFactory
  },
  '@ember/utils': _utils,
  '@ember/template': _template,
  '@ember/owner': _owner,
  '@glimmer/component': GlimmerComponent,
  '@glimmer/tracking': _tracking,
  'decorator-transforms/runtime': _decoratorsRuntime
};

function evalSnippet(compiled, extraModules = {}) {
  const exports = {};
  function require(moduleName) {
    const preConfigured = modules[moduleName] || extraModules[moduleName];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return preConfigured || window.require(moduleName);
  }
  eval(compiled);
  return Object.assign(exports, {
    require
  });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
/**
 * @public
 * Transpiles GlimmerJS (*.gjs) formatted text into and evaluates as a JS Module.
 * The returned component can be invoked explicitly in the consuming project.
 *
 * SEE: README for example usage
 *
 * @param {string} code: the code to be compiled
 * @param {Object} extraModules: map of import paths to modules. This isn't needed
 *  for classic ember projects, but for strict static ember projects, extraModules
 *  will need to be pasesd if compileJS is intended to be used in a styleguide or
 *  if there are additional modules that could be imported in the passed `code`.
 *
 *  Later on, imports that are not present by default (ember/glimmer) or that
 *  are not provided by extraModules will be searched on npm to see if a package
 *  needs to be downloaded before running the `code` / invoking the component
 */
async function compileJS(code, extraModules) {
  const name = nameFor(code);
  let component;
  let error;
  try {
    const compiled = await transpile({
      code: code,
      name
    });
    if (!compiled) {
      throw new Error(`Compiled output is missing`);
    }
    component = evalSnippet(compiled, extraModules).default;
  } catch (e) {
    error = e;
  }
  return {
    name,
    component,
    error
  };
}
async function transpile({
  code: input,
  name
}) {
  const preprocessed = await preprocess(input, name);
  const result = await transform(preprocessed, name);
  if (!result) {
    return;
  }
  const {
    code
  } = result;
  return code;
}
let processor;
let fetchingPromise;
async function preprocess(input, name) {
  if (!fetchingPromise) {
    fetchingPromise = __vitePreload(() => import('./standalone-fEnKn3Es.js'),true              ?[]:void 0);
  }
  if (!processor) {
    const {
      Preprocessor
    } = await fetchingPromise;
    processor = new Preprocessor();
  }
  const {
    code /* map */
  } = processor.process(input, {
    filename: `${name}.js`,
    inline_source_map: true
  });
  return code;
}
async function transform(intermediate, name) {
  const [
  // _parser, _traverse, _generator,
  _decoratorTransforms, _emberTemplateCompilation] = await Promise.all([
  // @babel/* doesn't have the greatest ESM compat yet
  // https://github.com/babel/babel/issues/14314#issuecomment-1054505190
  //
  // babel-standalone is so easy...
  // import('@babel/parser'),
  // import('@babel/traverse'),
  // import('@babel/generator'),
  __vitePreload(() => import('./index-DUmrJQA6.js'),true              ?__vite__mapDeps([0,1,2]):void 0), __vitePreload(() => import('./plugin-DSr8DBgu.js').then(n => n.p),true              ?__vite__mapDeps([3,4,5]):void 0)]);

  // These libraries are compiled incorrectly for cjs<->ESM compat
  const decoratorTransforms = 'default' in _decoratorTransforms ? _decoratorTransforms.default : _decoratorTransforms;
  const emberTemplateCompilation = 'default' in _emberTemplateCompilation ? _emberTemplateCompilation.default : _emberTemplateCompilation;

  // so we have to use the default export (which is all the exports)
  const maybeBabel = await __vitePreload(() => import('./babel-85PMSO9b.js').then(n => n.b),true              ?__vite__mapDeps([6,4]):void 0);
  // Handle difference between vite and webpack in consuming projects...
  const babel = 'availablePlugins' in maybeBabel ? maybeBabel : maybeBabel.default;
  return babel.transform(intermediate, {
    filename: `${name}.js`,
    plugins: [[emberTemplateCompilation, {
      compiler: _importSync20
    }], [
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - we don't care about types here..
    decoratorTransforms, {
      runtime: {
        import: 'decorator-transforms/runtime'
      }
    }],
    // Womp.
    // See this exploration into true ESM:
    //   https://github.com/NullVoxPopuli/limber/pull/1805
    [babel.availablePlugins['transform-modules-commonjs']]],
    presets: []
  });
}

export { compileJS };
