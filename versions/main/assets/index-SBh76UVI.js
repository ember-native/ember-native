const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/babel-85PMSO9b.js","assets/_commonjsHelpers-D5KtpA0t.js"])))=>i.map(i=>d[i]);
import { _ as _tracking, G as GlimmerComponent, E as _owner, a as templateFactory, F as _service, I as _runloop, J as _object, K as _modifier, L as _helpers, N as _destroyable, O as _debug, t as templateOnly, P as _array, Q as _application, d as nameFor, R as __vitePreload, e as esCompat } from './main-DC_2B1Zk.js';
import { b as babelPluginEmberTemplateCompilation } from './plugin-DSr8DBgu.js';
import { _ as _template, a as _utils, b as _EmberComponentHelper, c as _EmberComponent, d as _importSync20 } from './ember-template-compiler-MdXyx9il.js';
import './_commonjsHelpers-D5KtpA0t.js';
import './index-BecZGZPp.js';

/**
 * We need to import and hang on to these references so that they
 * don't get optimized away during deploy
 */
const modules = {
  '@ember/application': _application,
  '@ember/array': _array,
  '@ember/component': _EmberComponent,
  '@ember/component/helper': _EmberComponentHelper,
  '@ember/component/template-only': templateOnly,
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
  '@glimmer/tracking': _tracking
};

/* eslint-disable @typescript-eslint/no-unused-vars */
function evalSnippet(compiled, extraModules = {}) {
  const exports = {};
  function require(moduleName) {
    let preConfigured = modules[moduleName] || extraModules[moduleName];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return preConfigured || window.require(moduleName);
  }
  eval(compiled);
  return Object.assign(exports, {
    require
  });
}

async function compileJS(code, extraModules) {
  let name = nameFor(code);
  let component;
  let error;
  try {
    let compiled = await transpile({
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
  let preprocessed = await preprocess(input, name);
  let result = await transform(preprocessed, name);
  if (!result) {
    return;
  }
  let {
    code
  } = result;
  return code;
}
const compiler = esCompat(_importSync20);
let processor;
let fetchingPromise;
async function preprocess(input, name) {
  if (!fetchingPromise) {
    fetchingPromise = __vitePreload(() => import('./standalone-Cff8fiKJ.js'),true              ?[]:void 0);
  }
  if (!processor) {
    let {
      Preprocessor
    } = await fetchingPromise;
    processor = new Preprocessor();
  }
  return processor.process(input, `${name}.js`);
}
async function transform(intermediate, name, options = {}) {
  let babel = await __vitePreload(() => import('./babel-85PMSO9b.js').then(n => n.b),true              ?__vite__mapDeps([0,1]):void 0);
  return babel.transform(intermediate, {
    filename: `${name}.js`,
    plugins: [
    // [babelPluginIntermediateGJS],
    [babelPluginEmberTemplateCompilation, {
      compiler
    }], [babel.availablePlugins['proposal-decorators'], {
      legacy: true
    }], [babel.availablePlugins['proposal-class-properties']]],
    presets: [[babel.availablePresets['env'], {
      // false -- keeps ES Modules
      modules: 'cjs',
      targets: {
        esmodules: true
      },
      forceAllTransforms: false,
      ...options
    }]]
  });
}

export { compileJS };
