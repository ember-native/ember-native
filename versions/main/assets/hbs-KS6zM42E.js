import { p as nameFor, s as setComponentTemplate, t as templateOnly, q as esCompat, o as on, h as hash, g as get, f as fn, c as concat, b as array, a as templateFactory } from './main-CjWhnG7r.js';
import { _ as _importSync20 } from './index-Dhox4uAs.js';
import { _ as _importSync40 } from './index-BSZFMcPe.js';

const {
  precompileJSON
} = esCompat(_importSync20);
const {
  getTemplateLocals
} = esCompat(_importSync40);

/**
 * compile a template with an empty scope
 * to use components, helpers, etc, you will need to compile with JS
 *
 * (templates alone do not have a way to import / define complex structures)
 */
function compileHBS(template, options = {}) {
  let name = nameFor(template);
  let component;
  let error;
  try {
    component = setComponentTemplate(compileTemplate(template, {
      moduleName: options.moduleName || name,
      ...options
    }), templateOnly(undefined, "hbs:component"));
  } catch (e) {
    error = e;
  }
  return {
    name,
    component,
    error
  };
}
/**
 * The reason why we can't use precompile directly is because of this:
 * https://github.com/glimmerjs/glimmer-vm/blob/master/packages/%40glimmer/compiler/lib/compiler.ts#L132
 *
 * Support for dynamically compiling templates in strict mode doesn't seem to be fully their yet.
 * That JSON.stringify (and the lines after) prevent us from easily setting the scope function,
 * which means that *everything* is undefined.
 */
function compileTemplate(source, {
  moduleName,
  scope = {}
}) {
  let localScope = {
    array,
    concat,
    fn,
    get,
    hash,
    on,
    ...scope
  };
  let locals = getTemplateLocals(source);
  let options = {
    strictMode: true,
    moduleName,
    locals,
    isProduction: false,
    meta: {
      moduleName
    }
  };

  // Copied from @glimmer/compiler/lib/compiler#precompile
  let [block, usedLocals] = precompileJSON(source, options);
  let usedScope = usedLocals.map(key => {
    let value = localScope[key];
    if (!value) {
      throw new Error(`Attempt to use ${key} in compiled hbs, but it was not available in scope. ` + `Available scope includes: ${Object.keys(localScope)}`);
    }
    return value;
  });
  let blockJSON = JSON.stringify(block);
  let templateJSONObject = {
    id: moduleName,
    block: blockJSON,
    moduleName: moduleName ?? '(dynamically compiled component)',
    scope: () => usedScope,
    isStrictMode: true
  };
  let factory = templateFactory(templateJSONObject);
  return factory;
}

export { compileHBS };
