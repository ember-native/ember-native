import { T as Tr } from './index-BFICbBOq.js';
import { Z as Zt } from './index-BecZGZPp.js';
import { n as nameFor, s as setComponentTemplate, t as templateOnly, o as on, h as hash, g as get, f as fn, c as concat, b as array, a as templateFactory } from './main-UBeHWpUP.js';

// import { precompileJSON } from '@glimmer/compiler';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// These things are pre-bundled in the old system.
// ember-template-compiler defines them in AMD/requirejs
/**
 * compile a template with an empty scope
 * to use components, helpers, etc, you will need to compile with JS
 *
 * (templates alone do not have a way to import / define complex structures)
 */
function compileHBS(template, options = {}) {
  const name = nameFor(template);
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
  const localScope = {
    array,
    concat,
    fn,
    get,
    hash,
    on,
    ...scope
  };
  const locals = Zt(source);
  const options = {
    strictMode: true,
    moduleName,
    locals,
    isProduction: false,
    meta: {
      moduleName
    }
  };

  // Copied from @glimmer/compiler/lib/compiler#precompile
  const [block, usedLocals] = Tr(source, options);
  const usedScope = usedLocals.map(key => {
    const value = localScope[key];
    if (!value) {
      throw new Error(`Attempt to use ${key} in compiled hbs, but it was not available in scope. ` + `Available scope includes: ${Object.keys(localScope)}`);
    }
    return value;
  });
  const blockJSON = JSON.stringify(block);
  const templateJSONObject = {
    id: moduleName,
    block: blockJSON,
    moduleName: moduleName ?? '(dynamically compiled component)',
    scope: () => usedScope,
    isStrictMode: true
  };
  const factory = templateFactory(templateJSONObject);
  return factory;
}

export { compileHBS };
