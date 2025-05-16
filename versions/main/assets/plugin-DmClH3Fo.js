import { a as getAugmentedNamespace, g as getDefaultExportFromCjs } from './_commonjsHelpers-D5KtpA0t.js';
import { _ as _importSync40 } from './index-BSZFMcPe.js';

function _mergeNamespaces(n, m) {
    for (var i = 0; i < m.length; i++) {
        const e = m[i];
        if (typeof e !== 'string' && !Array.isArray(e)) { for (const k in e) {
            if (k !== 'default' && !(k in n)) {
                const d = Object.getOwnPropertyDescriptor(e, k);
                if (d) {
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: () => e[k]
                    });
                }
            }
        } }
    }
    return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: 'Module' }));
}

var plugin$1 = {};

var src = {};

var sanitize = {};

var hasRequiredSanitize;

function requireSanitize () {
	if (hasRequiredSanitize) return sanitize;
	hasRequiredSanitize = 1;

	// make a name into a valid javascript identifier, as pleasantly as possible.
	Object.defineProperty(sanitize, "__esModule", {
	  value: true
	});
	sanitize.sanitize = void 0;
	function sanitize$1(identifier) {
	  // first we opportunistically do camelization when an illegal character is not
	  // the first character and is followed by a lowercase letter, in an effort to
	  // aid readability of the output.
	  let cleaned = identifier.replace(new RegExp(`(?<!^)(?:${illegalChar.source})([a-z])`, 'g'), (_m, letter) => letter.toUpperCase());
	  // then we unliterally strip all remaining illegal characters.
	  cleaned = cleaned.replace(new RegExp(illegalChar.source, 'g'), '');
	  return cleaned;
	}
	sanitize.sanitize = sanitize$1;
	const illegalChar = /^[^a-zA-Z_$]|(?<=.)[^a-zA-Z_$0-9]/;
	return sanitize;
}

var hasRequiredSrc;

function requireSrc () {
	if (hasRequiredSrc) return src;
	hasRequiredSrc = 1;

	Object.defineProperty(src, "__esModule", {
	  value: true
	});
	src.ImportUtil = void 0;
	const sanitize_1 = requireSanitize();
	class ImportUtil {
	  constructor(babel, program) {
	    this.babel = babel;
	    this.program = program;
	    this.t = babel.types;
	  }
	  // remove one imported binding. If this is the last thing imported from the
	  // given moduleSpecifier, the whole statement will also be removed.
	  removeImport(moduleSpecifier, exportedName) {
	    for (let topLevelPath of this.program.get('body')) {
	      if (!matchModule(topLevelPath, moduleSpecifier)) {
	        continue;
	      }
	      let importSpecifierPath = topLevelPath.get('specifiers').find(specifierPath => matchSpecifier(specifierPath, exportedName));
	      if (importSpecifierPath) {
	        if (topLevelPath.node.specifiers.length === 1) {
	          topLevelPath.remove();
	        } else {
	          importSpecifierPath.remove();
	        }
	      }
	    }
	  }
	  // remove all imports from the given moduleSpecifier
	  removeAllImports(moduleSpecifier) {
	    for (let topLevelPath of this.program.get('body')) {
	      if (matchModule(topLevelPath, moduleSpecifier)) {
	        topLevelPath.remove();
	      }
	    }
	  }
	  // Import the given value (if needed) and return an Identifier representing
	  // it.
	  //
	  // This method is trickier to use safely than our higher-level methods
	  // (`insertAfter`, `insertBefore`, `replaceWith`, `mutate`) because after you
	  // insert the identifier into the AST, it's up to you to ensure that babel's
	  // scope system is aware of the new reference. The other methods do that for
	  // you automatically.
	  import(
	  // the spot at which you will insert the Identifier we return to you
	  target,
	  // the path to the module you're importing from
	  moduleSpecifier,
	  // the name you're importing from that module. Use "default" for the default
	  // export. Use "*" for the namespace.
	  exportedName,
	  // Optional hint for helping us pick a name for the imported binding
	  nameHint) {
	    return this.unreferencedImport(target, moduleSpecifier, exportedName, desiredName(nameHint, exportedName, defaultNameHint(target)));
	  }
	  // Import the given value (if needed) and return an Identifier representing
	  // it.
	  unreferencedImport(
	  // the spot at which you will insert the Identifier we return to you
	  target,
	  // the path to the module you're importing from
	  moduleSpecifier,
	  // the name you're importing from that module. Use "default" for the default
	  // export. Use "*" for the namespace.
	  exportedName,
	  // the preferred name you want, if we neeed to create a new binding. You
	  // might get something similar instead, to avoid collisions.
	  preferredName) {
	    var _a;
	    let isNamespaceImport = exportedName === '*';
	    let isDefaultImport = exportedName === 'default';
	    let isNamedImport = !isDefaultImport && !isNamespaceImport;
	    let declaration = this.findImportFrom(moduleSpecifier);
	    let hasNamespaceSpecifier = declaration === null || declaration === void 0 ? void 0 : declaration.node.specifiers.find(s => s.type === 'ImportNamespaceSpecifier');
	    let hasNamedSpecifiers = declaration === null || declaration === void 0 ? void 0 : declaration.node.specifiers.find(s => s.type === 'ImportSpecifier');
	    /**
	     * the file has a preexisting non-namespace import and a transform tries to add a namespace import, so they don't get combined
	     * the file has a preexisting namespace import and a transform tries to add a non-namespace import, so they don't get combined
	     * the file has a preexisting namespace import and a transform tries to add a namespace import, so they don't get combined
	     */
	    let cannotUseExistingDeclaration = hasNamedSpecifiers && isNamespaceImport || hasNamespaceSpecifier && isNamedImport || hasNamespaceSpecifier && isNamespaceImport;
	    if (!cannotUseExistingDeclaration && declaration) {
	      let specifier = declaration.get('specifiers').find(spec => matchSpecifier(spec, exportedName));
	      if (specifier && ((_a = target.scope.getBinding(specifier.node.local.name)) === null || _a === void 0 ? void 0 : _a.kind) === 'module') {
	        return this.t.identifier(specifier.node.local.name);
	      } else {
	        return this.addSpecifier(target, declaration, exportedName, preferredName);
	      }
	    } else {
	      let declaration = this.insertAfterExistingImports(this.t.importDeclaration([], this.t.stringLiteral(moduleSpecifier)));
	      return this.addSpecifier(target, declaration, exportedName, preferredName);
	    }
	  }
	  importForSideEffect(moduleSpecifier) {
	    let declaration = this.findImportFrom(moduleSpecifier);
	    if (!declaration) {
	      this.insertAfterExistingImports(this.t.importDeclaration([], this.t.stringLiteral(moduleSpecifier)));
	    }
	  }
	  replaceWith(target, fn) {
	    return this.mutate(i => {
	      target.replaceWith(fn(i));
	      // the return value of replaceWith is not a reliable way to get the
	      // updated path, at least in the case where the user replaced an
	      // expression with a statement. Instead we will rely on the fact that path
	      // replacement also mutates its argument, so `target` now points at the
	      // newly replaced path.
	      return target;
	    }, defaultNameHint(target));
	  }
	  insertAfter(target, fn) {
	    return this.mutate(i => target.insertAfter(fn(i))[0], defaultNameHint(target));
	  }
	  insertBefore(target, fn) {
	    return this.mutate(i => target.insertBefore(fn(i))[0], defaultNameHint(target));
	  }
	  // Low-level method for when you don't want to use our higher-level methods
	  // (replaceWith, insertBefore, insertAfter)
	  mutate(fn, defaultNameHint) {
	    let symbols = new Map();
	    const importer = {
	      import: (moduleSpecifier, exportedName, nameHint) => {
	        let identifier = this.t.identifier('__babel_import_util_placeholder__');
	        symbols.set(identifier, {
	          moduleSpecifier,
	          exportedName,
	          nameHint
	        });
	        return identifier;
	      }
	    };
	    const updateReference = path => {
	      if (!path.isIdentifier()) {
	        return;
	      }
	      let hit = symbols.get(path.node);
	      if (hit) {
	        let newIdentifier = this.unreferencedImport(path, hit.moduleSpecifier, hit.exportedName, desiredName(hit.nameHint, hit.exportedName, defaultNameHint));
	        path.replaceWith(newIdentifier);
	        let binding = path.scope.getBinding(newIdentifier.name);
	        if (!binding) {
	          // we create the binding at the point where we add the import, so this
	          // would indicate broken behavior
	          throw new Error(`bug: this is supposed to never happen`);
	        }
	        binding.reference(path);
	      }
	    };
	    let result = fn(importer);
	    updateReference(result);
	    this.babel.traverse(result.node, {
	      ReferencedIdentifier: path => {
	        updateReference(path);
	      }
	    }, result.scope, {}, result);
	    return result;
	  }
	  addSpecifier(target, declaration, exportedName, preferredName) {
	    let local = this.t.identifier(unusedNameLike(target, preferredName));
	    let specifier = this.buildSpecifier(exportedName, local);
	    let added;
	    if (specifier.type === 'ImportDefaultSpecifier') {
	      declaration.node.specifiers.unshift(specifier);
	      added = declaration.get(`specifiers.0`);
	    } else {
	      declaration.node.specifiers.push(specifier);
	      added = declaration.get(`specifiers.${declaration.node.specifiers.length - 1}`);
	    }
	    declaration.scope.registerBinding('module', added);
	    return local;
	  }
	  buildSpecifier(exportedName, localName) {
	    switch (exportedName) {
	      case 'default':
	        return this.t.importDefaultSpecifier(localName);
	      case '*':
	        return this.t.importNamespaceSpecifier(localName);
	      default:
	        return this.t.importSpecifier(localName, this.t.identifier(exportedName));
	    }
	  }
	  findImportFrom(moduleSpecifier) {
	    for (let path of this.program.get('body')) {
	      if (path.isImportDeclaration() && path.node.source.value === moduleSpecifier && path.node.importKind !== 'type') {
	        return path;
	      }
	    }
	    return undefined;
	  }
	  insertAfterExistingImports(statement) {
	    let lastIndex;
	    for (let [index, node] of this.program.node.body.entries()) {
	      if (node.type === 'ImportDeclaration') {
	        lastIndex = index;
	      }
	    }
	    if (lastIndex == null) {
	      // we are intentionally not using babel's container-aware methods, because
	      // while in theory it's nice that they schedule other plugins to run on
	      // our nodes, in practice those nodes might get mutated or removed by some
	      // other plugin in the intervening time causing failures.
	      this.program.node.body.unshift(statement);
	      return this.program.get('body.0');
	    } else {
	      this.program.node.body.splice(lastIndex + 1, 0, statement);
	      return this.program.get(`body.${lastIndex + 1}`);
	    }
	  }
	}
	src.ImportUtil = ImportUtil;
	function unusedNameLike(path, name) {
	  let candidate = name;
	  let counter = 0;
	  while (path.scope.hasBinding(candidate)) {
	    candidate = `${name}${counter++}`;
	  }
	  return candidate;
	}
	function name(node) {
	  if (node.type === 'StringLiteral') {
	    return node.value;
	  } else {
	    return node.name;
	  }
	}
	function desiredName(nameHint, exportedName, defaultNameHint) {
	  if (nameHint) {
	    return (0, sanitize_1.sanitize)(nameHint);
	  }
	  if (exportedName === 'default' || exportedName === '*') {
	    return defaultNameHint !== null && defaultNameHint !== void 0 ? defaultNameHint : 'a';
	  } else {
	    return exportedName;
	  }
	}
	function defaultNameHint(target) {
	  if (target === null || target === void 0 ? void 0 : target.isIdentifier()) {
	    return target.node.name;
	  } else if (target) {
	    return target.scope.generateUidIdentifierBasedOnNode(target.node).name;
	  } else {
	    return undefined;
	  }
	}
	function matchSpecifier(spec, exportedName) {
	  switch (exportedName) {
	    case 'default':
	      return spec.isImportDefaultSpecifier();
	    case '*':
	      return spec.isImportNamespaceSpecifier();
	    default:
	      return spec.isImportSpecifier() && name(spec.node.imported) === exportedName;
	  }
	}
	function matchModule(path, moduleSpecifier) {
	  return path.isImportDeclaration() && path.get('source').node.value === moduleSpecifier;
	}
	return src;
}

var expressionParser = {};

var scopeLocals = {};

var hbsUtils = {};

var hasRequiredHbsUtils;

function requireHbsUtils () {
	if (hasRequiredHbsUtils) return hbsUtils;
	hasRequiredHbsUtils = 1;

	Object.defineProperty(hbsUtils, "__esModule", {
	  value: true
	});
	hbsUtils.astNodeHasBinding = astNodeHasBinding;
	function astNodeHasBinding(target, name) {
	  var _a;
	  let cursor = target;
	  while (cursor) {
	    let parentNode = (_a = cursor.parent) === null || _a === void 0 ? void 0 : _a.node;
	    if ((parentNode === null || parentNode === void 0 ? void 0 : parentNode.type) === 'ElementNode' && parentNode.blockParams.includes(name) &&
	    // an ElementNode's block params are valid only within its children
	    parentNode.children.includes(cursor.node)) {
	      return true;
	    }
	    if ((parentNode === null || parentNode === void 0 ? void 0 : parentNode.type) === 'Block' && parentNode.blockParams.includes(name) &&
	    // a Block's blockParams are valid only within its body
	    parentNode.body.includes(cursor.node)) {
	      return true;
	    }
	    cursor = cursor.parent;
	  }
	  return false;
	}
	return hbsUtils;
}

var readOnlyArray = {};

var hasRequiredReadOnlyArray;

function requireReadOnlyArray () {
	if (hasRequiredReadOnlyArray) return readOnlyArray;
	hasRequiredReadOnlyArray = 1;

	Object.defineProperty(readOnlyArray, "__esModule", {
	  value: true
	});
	readOnlyArray.readOnlyArray = readOnlyArray$1;
	const mutationMethods = ['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'];
	function readOnlyArray$1(array, message = 'Forbidden array mutation') {
	  return new Proxy(array, {
	    get(target, prop) {
	      if (typeof prop === 'string' && mutationMethods.includes(prop)) {
	        return () => {
	          throw new Error(message);
	        };
	      }
	      return Reflect.get(target, prop);
	    },
	    set(_target, _prop) {
	      throw new Error(message);
	    },
	    deleteProperty() {
	      throw new Error(message);
	    }
	  });
	}
	return readOnlyArray;
}

var hasRequiredScopeLocals;

function requireScopeLocals () {
	if (hasRequiredScopeLocals) return scopeLocals;
	hasRequiredScopeLocals = 1;
	(function (exports) {

		/*
		  This class exists because:
		   - before template compilation starts, we need to pass a `locals` array to
		     ember-template-compiler
		   - the JSUtils API can mutate the scope during template compilation
		   - those scope mutations need to update both the original `locals` array and
		     our own name mapping, keeping them in sync.
		*/
		var __classPrivateFieldSet = scopeLocals && scopeLocals.__classPrivateFieldSet || function (receiver, state, value, kind, f) {
		  if (kind === "m") throw new TypeError("Private method is not writable");
		  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
		  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
		  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
		};
		var __classPrivateFieldGet = scopeLocals && scopeLocals.__classPrivateFieldGet || function (receiver, state, kind, f) {
		  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
		  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
		  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
		};
		var _ScopeLocals_instances, _ScopeLocals_mapping, _ScopeLocals_locals, _ScopeLocals_params, _ScopeLocals_isInJsScope;
		Object.defineProperty(exports, "__esModule", {
		  value: true
		});
		exports.ScopeLocals = exports.ALLOWED_GLOBALS = void 0;
		const hbs_utils_1 = requireHbsUtils();
		const read_only_array_1 = requireReadOnlyArray();
		/**
		 * RFC: https://github.com/emberjs/rfcs/pull/1070
		 *
		 * Criteria for inclusion in this list:
		 *
		 *   Any of:
		 *     - begins with an uppercase letter
		 *     - guaranteed to never be added to glimmer as a keyword (e.g.: globalThis)
		 *
		 *   And:
		 *     - must not need new to invoke
		 *     - must not require lifetime management (e.g.: setTimeout)
		 *     - must not be a single-word lower-case API, because of potential collision with future new HTML elements
		 *     - if the API is a function, the return value should not be a promise
		 *     - must be one one of these lists:
		 *        - https://tc39.es/ecma262/#sec-global-object
		 *        - https://tc39.es/ecma262/#sec-function-properties-of-the-global-object
		 *        - https://html.spec.whatwg.org/multipage/nav-history-apis.html#window
		 *        - https://html.spec.whatwg.org/multipage/indices.html#all-interfaces
		 *        - https://html.spec.whatwg.org/multipage/webappapis.html
		 */
		exports.ALLOWED_GLOBALS = new Set([
		// ////////////////
		// namespaces
		// ////////////////
		//   TC39
		'globalThis', 'Atomics', 'JSON', 'Math', 'Reflect',
		//   WHATWG
		'localStorage', 'sessionStorage',
		// ////////////////
		// functions / utilities
		// ////////////////
		//   TC39
		'isNaN', 'isFinite', 'parseInt', 'parseFloat', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent',
		//   WHATWG
		'postMessage', 'structuredClone',
		// ////////////////
		// new-less Constructors (still functions)
		// ////////////////
		//   TC39
		'Array',
		// different behavior from (array)
		'BigInt', 'Boolean', 'Date', 'Number', 'Object',
		// different behavior from (hash)
		'String',
		// ////////////////
		// Values
		// ////////////////
		//   TC39
		'Infinity', 'NaN',
		//   WHATWG
		'isSecureContext']);
		class ScopeLocals {
		  constructor(params) {
		    _ScopeLocals_instances.add(this);
		    _ScopeLocals_mapping.set(this, {});
		    _ScopeLocals_locals.set(this, []);
		    _ScopeLocals_params.set(this, void 0);
		    __classPrivateFieldSet(this, _ScopeLocals_params, params, "f");
		  }
		  get locals() {
		    return (0, read_only_array_1.readOnlyArray)(__classPrivateFieldGet(this, _ScopeLocals_locals, "f"), 'The only supported way to manipulate locals is via the jsutils API\nhttps://github.com/emberjs/babel-plugin-ember-template-compilation#jsutils-manipulating-javascript-from-within-ast-transforms');
		  }
		  has(key) {
		    return key in __classPrivateFieldGet(this, _ScopeLocals_mapping, "f");
		  }
		  get(key) {
		    return __classPrivateFieldGet(this, _ScopeLocals_mapping, "f")[key];
		  }
		  isEmpty() {
		    return __classPrivateFieldGet(this, _ScopeLocals_locals, "f").length === 0;
		  }
		  entries() {
		    return Object.entries(__classPrivateFieldGet(this, _ScopeLocals_mapping, "f"));
		  }
		  add(hbsName, jsName) {
		    __classPrivateFieldGet(this, _ScopeLocals_mapping, "f")[hbsName] = jsName !== null && jsName !== void 0 ? jsName : hbsName;
		    if (!__classPrivateFieldGet(this, _ScopeLocals_locals, "f").includes(hbsName)) {
		      __classPrivateFieldGet(this, _ScopeLocals_locals, "f").push(hbsName);
		    }
		  }
		  // this AST transform discovers all possible upvars in HBS that refer to valid
		  // bindings in JS, and then depending on the mode adjusts our actual scope bag
		  // contents.
		  crawl() {
		    return _env => {
		      let seen;
		      return {
		        name: 'scope-locals-crawl',
		        visitor: {
		          Template: {
		            enter: () => {
		              seen = new Set();
		            },
		            exit: (_node, _path) => {
		              if (__classPrivateFieldGet(this, _ScopeLocals_params, "f").mode === 'implicit') {
		                // all hbs upvars that have matching JS bindings go into the
		                // scope
		                for (let name of seen) {
		                  if (name === 'this') {
		                    if (__classPrivateFieldGet(this, _ScopeLocals_params, "f").mayUseLexicalThis) {
		                      this.add(name);
		                    }
		                  } else if (__classPrivateFieldGet(this, _ScopeLocals_instances, "m", _ScopeLocals_isInJsScope).call(this, name, __classPrivateFieldGet(this, _ScopeLocals_params, "f").jsPath)) {
		                    this.add(name);
		                  }
		                }
		              } else {
		                // in explicit form, we might prune back the preexising scope in
		                // the case where another AST transform has eliminated the use
		                // of the original binding. But we don't add anything new. The
		                // only way for new bindings to be introduced into scope is for
		                // another AST transform to explicitly call the jsutils, which
		                // calls our `add`.
		                for (let name of Object.keys(__classPrivateFieldGet(this, _ScopeLocals_mapping, "f"))) {
		                  if (!seen.has(name)) {
		                    __classPrivateFieldGet(this, _ScopeLocals_locals, "f").splice(__classPrivateFieldGet(this, _ScopeLocals_locals, "f").indexOf(name), 1);
		                    delete __classPrivateFieldGet(this, _ScopeLocals_mapping, "f")[name];
		                  }
		                }
		              }
		            }
		          },
		          PathExpression: (node, path) => {
		            switch (node.head.type) {
		              case 'ThisHead':
		                if (!(0, hbs_utils_1.astNodeHasBinding)(path, 'this')) {
		                  seen.add('this');
		                }
		                break;
		              case 'VarHead':
		                {
		                  const name = node.head.name;
		                  if (!(0, hbs_utils_1.astNodeHasBinding)(path, name)) {
		                    seen.add(name);
		                  }
		                }
		            }
		          },
		          ElementNode: (node, path) => {
		            const name = node.tag.split('.')[0];
		            if (!(0, hbs_utils_1.astNodeHasBinding)(path, name)) {
		              seen.add(name);
		            }
		          }
		        }
		      };
		    };
		  }
		}
		exports.ScopeLocals = ScopeLocals;
		_ScopeLocals_mapping = new WeakMap(), _ScopeLocals_locals = new WeakMap(), _ScopeLocals_params = new WeakMap(), _ScopeLocals_instances = new WeakSet(), _ScopeLocals_isInJsScope = function _ScopeLocals_isInJsScope(hbsName, jsPath) {
		  var _a;
		  let jsName = (_a = __classPrivateFieldGet(this, _ScopeLocals_mapping, "f")[hbsName]) !== null && _a !== void 0 ? _a : hbsName;
		  return exports.ALLOWED_GLOBALS.has(jsName) || jsPath.scope.getBinding(jsName);
		}; 
	} (scopeLocals));
	return scopeLocals;
}

var hasRequiredExpressionParser;

function requireExpressionParser () {
	if (hasRequiredExpressionParser) return expressionParser;
	hasRequiredExpressionParser = 1;

	Object.defineProperty(expressionParser, "__esModule", {
	  value: true
	});
	expressionParser.ExpressionParser = void 0;
	const scope_locals_1 = requireScopeLocals();
	class ExpressionParser {
	  constructor(babel) {
	    this.babel = babel;
	  }
	  parseExpression(invokedName, path) {
	    switch (path.node.type) {
	      case 'ObjectExpression':
	        return this.parseObjectExpression(invokedName, path);
	      case 'ArrayExpression':
	        {
	          return this.parseArrayExpression(invokedName, path);
	        }
	      case 'StringLiteral':
	      case 'BooleanLiteral':
	      case 'NumericLiteral':
	        return path.node.value;
	      default:
	        throw path.buildCodeFrameError(`${invokedName} can only accept static options but you passed ${JSON.stringify(path.node)}`);
	    }
	  }
	  parseArrayExpression(invokedName, path) {
	    return path.get('elements').map(element => {
	      if (element.isSpreadElement()) {
	        throw element.buildCodeFrameError(`spread element is not allowed here`);
	      } else if (element.isExpression()) {
	        return this.parseExpression(invokedName, element);
	      }
	      return null;
	    });
	  }
	  parseScope(invokedName, path) {
	    let body = undefined;
	    if (path.node.type === 'ObjectMethod') {
	      body = path.node.body;
	    } else {
	      let {
	        value
	      } = path.node;
	      if (this.t.isObjectExpression(value)) {
	        throw path.buildCodeFrameError(`Passing an object as the \`scope\` property to inline templates is no longer supported. Please pass a function that returns an object expression instead.`);
	      }
	      if (this.t.isFunctionExpression(value) || this.t.isArrowFunctionExpression(value)) {
	        body = value.body;
	      }
	    }
	    let objExpression = undefined;
	    if ((body === null || body === void 0 ? void 0 : body.type) === 'ObjectExpression') {
	      objExpression = body;
	    } else if ((body === null || body === void 0 ? void 0 : body.type) === 'BlockStatement') {
	      // SAFETY: We know that the body is a ReturnStatement because we're checking inside
	      let returnStatements = body.body.filter(statement => statement.type === 'ReturnStatement');
	      if (returnStatements.length !== 1) {
	        throw new Error('Scope functions must have a single return statement which returns an object expression containing references to in-scope values');
	      }
	      objExpression = returnStatements[0].argument;
	    }
	    if ((objExpression === null || objExpression === void 0 ? void 0 : objExpression.type) !== 'ObjectExpression') {
	      throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` must be an object expression containing only references to in-scope values, or a function that returns an object expression containing only references to in-scope values`);
	    }
	    return objExpression.properties.reduce((res, prop) => {
	      if (this.t.isSpreadElement(prop)) {
	        throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` may not contain spread elements`);
	      }
	      if (this.t.isObjectMethod(prop)) {
	        throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` may not contain methods`);
	      }
	      let {
	        key,
	        value
	      } = prop;
	      if (!this.t.isStringLiteral(key) && !this.t.isIdentifier(key)) {
	        throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` may only contain static property names`);
	      }
	      let propName = name(key);
	      switch (value.type) {
	        case 'Identifier':
	          res.add(propName, value.name);
	          break;
	        case 'ThisExpression':
	          res.add(propName, 'this');
	          break;
	        default:
	          throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` may only contain direct references to in-scope values, e.g. { ${propName} } or { ${propName}: ${propName} }. Found ${value.type}`);
	      }
	      return res;
	    }, new scope_locals_1.ScopeLocals({
	      mode: 'explicit'
	    }));
	  }
	  parseEval(invokedName, path) {
	    let body;
	    if (path.isObjectMethod()) {
	      body = path.get('body');
	    } else if (path.isObjectProperty()) {
	      let value = path.get('value');
	      if (value.isFunctionExpression()) {
	        body = value.get('body');
	      } else {
	        throw path.buildCodeFrameError(`unsupported syntax for \`eval\` parameter to \`${invokedName}\`. It must be an object method or a function.`);
	      }
	    } else {
	      throw path.buildCodeFrameError(`unsupported syntax for \`eval\` parameter to \`${invokedName}\`. It must be an object method or a function.`);
	    }
	    let returnStatements = body.get('body').filter(statement => statement.isReturnStatement());
	    if (returnStatements.length !== 1) {
	      throw body.buildCodeFrameError('eval function must have a single return statement');
	    }
	    let returnExpression = returnStatements[0].get('argument');
	    if (!returnExpression.isCallExpression()) {
	      throw returnStatements[0].buildCodeFrameError('eval function must return `eval(arguments[0])`. Found non-CallExpression.');
	    }
	    let callee = returnExpression.get('callee');
	    if (!callee.isIdentifier() || callee.node.name !== 'eval') {
	      throw returnExpression.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found callee is not eval.');
	    }
	    let args = returnExpression.get('arguments');
	    if (args.length !== 1) {
	      throw returnExpression.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found incorrect number of arguments.');
	    }
	    let arg = args[0];
	    if (!arg.isMemberExpression()) {
	      throw arg.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found argument is non-MemberExpression.');
	    }
	    let obj = arg.get('object');
	    if (!obj.isIdentifier() || obj.node.name !== 'arguments') {
	      throw obj.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found wrong argument to eval.');
	    }
	    let prop = arg.get('property');
	    if (!prop.isNumericLiteral() || prop.node.value !== 0) {
	      throw prop.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found wrong property.');
	    }
	    return {
	      isEval: true
	    };
	  }
	  parseObjectExpression(invokedName, path, shouldParseScope = false, shouldSupportRFC931 = false) {
	    let result = {};
	    path.get('properties').forEach(property => {
	      let {
	        node
	      } = property;
	      if (this.t.isSpreadElement(node)) {
	        throw property.buildCodeFrameError(`${invokedName} does not allow spread element`);
	      }
	      if (node.computed) {
	        throw property.buildCodeFrameError(`${invokedName} can only accept static property names`);
	      }
	      let {
	        key
	      } = node;
	      if (!this.t.isIdentifier(key) && !this.t.isStringLiteral(key)) {
	        throw property.buildCodeFrameError(`${invokedName} can only accept static property names`);
	      }
	      let propertyName = name(key);
	      if (shouldParseScope && propertyName === 'scope') {
	        result.scope = this.parseScope(invokedName, property);
	      } else if (shouldSupportRFC931 && propertyName === 'eval') {
	        result.eval = this.parseEval(invokedName, property);
	      } else if (shouldSupportRFC931 && propertyName === 'component') {
	        result.component = property.get('value');
	      } else {
	        if (this.t.isObjectMethod(node)) {
	          throw property.buildCodeFrameError(`${invokedName} does not accept a method for ${propertyName}`);
	        }
	        let valuePath = property.get('value');
	        if (!valuePath.isExpression()) {
	          throw valuePath.buildCodeFrameError(`must be an expression`);
	        }
	        result[propertyName] = this.parseExpression(invokedName, valuePath);
	      }
	    });
	    return result;
	  }
	  get t() {
	    return this.babel.types;
	  }
	}
	expressionParser.ExpressionParser = ExpressionParser;
	function name(node) {
	  if (node.type === 'StringLiteral') {
	    return node.value;
	  } else {
	    return node.name;
	  }
	}
	return expressionParser;
}

var jsUtils = {};

var hasRequiredJsUtils;

function requireJsUtils () {
	if (hasRequiredJsUtils) return jsUtils;
	hasRequiredJsUtils = 1;

	var __classPrivateFieldSet = jsUtils && jsUtils.__classPrivateFieldSet || function (receiver, state, value, kind, f) {
	  if (kind === "m") throw new TypeError("Private method is not writable");
	  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
	  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
	  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
	};
	var __classPrivateFieldGet = jsUtils && jsUtils.__classPrivateFieldGet || function (receiver, state, kind, f) {
	  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
	  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
	  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
	};
	var _JSUtils_instances, _JSUtils_babel, _JSUtils_state, _JSUtils_template, _JSUtils_addedBinding, _JSUtils_importer, _JSUtils_emitStatement, _JSUtils_parseExpression, _ExpressionContext_importer, _ExpressionContext_target;
	Object.defineProperty(jsUtils, "__esModule", {
	  value: true
	});
	jsUtils.JSUtils = void 0;
	const hbs_utils_1 = requireHbsUtils();
	// This exists to give AST plugins a controlled interface for influencing the
	// surrounding Javascript scope
	class JSUtils {
	  constructor(babel, state, template, addedBinding, importer) {
	    _JSUtils_instances.add(this);
	    _JSUtils_babel.set(this, void 0);
	    _JSUtils_state.set(this, void 0);
	    _JSUtils_template.set(this, void 0);
	    _JSUtils_addedBinding.set(this, void 0);
	    _JSUtils_importer.set(this, void 0);
	    __classPrivateFieldSet(this, _JSUtils_babel, babel, "f");
	    __classPrivateFieldSet(this, _JSUtils_state, state, "f");
	    __classPrivateFieldSet(this, _JSUtils_template, template, "f");
	    __classPrivateFieldSet(this, _JSUtils_addedBinding, addedBinding, "f");
	    __classPrivateFieldSet(this, _JSUtils_importer, importer, "f");
	    if (!__classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath) {
	      let target;
	      for (let statement of __classPrivateFieldGet(this, _JSUtils_state, "f").program.get('body')) {
	        if (!statement.isImportDeclaration()) {
	          break;
	        }
	        target = statement;
	      }
	      if (target) {
	        __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath = target;
	      }
	    }
	  }
	  /**
	   * Create a new binding that you can use in your template, initialized with
	   * the given Javascript expression.
	   *
	   * @param { Expression } expression A javascript expression whose value will
	   * initialize your new binding. See docs on the Expression type for details.
	   * @param target The location within your template where the binding will be
	   * used. This matters so we can avoid naming collisions.
	   * @param opts.nameHint Optionally, provide a descriptive name for your new
	   * binding. We will mangle this name as needed to avoid collisions, but
	   * picking a good name here can aid in debugging.
	   *
	   * @return The name you can use in your template to access the binding.
	   */
	  bindExpression(expression, target, opts) {
	    var _a;
	    let name = unusedNameLike((_a = opts === null || opts === void 0 ? void 0 : opts.nameHint) !== null && _a !== void 0 ? _a : 'a', candidate => __classPrivateFieldGet(this, _JSUtils_template, "f").scope.hasBinding(candidate) || (0, hbs_utils_1.astNodeHasBinding)(target, candidate));
	    let t = __classPrivateFieldGet(this, _JSUtils_babel, "f").types;
	    let declaration = __classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_emitStatement).call(this, t.variableDeclaration('let', [t.variableDeclarator(t.identifier(name), __classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_parseExpression).call(this, __classPrivateFieldGet(this, _JSUtils_state, "f").program, expression))]));
	    declaration.scope.registerBinding('let', declaration.get('declarations.0'));
	    __classPrivateFieldGet(this, _JSUtils_addedBinding, "f").call(this, name);
	    return name;
	  }
	  /**
	   * Gain access to an imported value within your template.
	   *
	   * @param moduleSpecifier The path to import from.
	   * @param exportedName The named export you wish to access, or "default" for
	   * the default export, or "*" for the namespace export.
	   * @param target The location within your template where the binding will be
	   * used. This matters so we can avoid naming collisions.
	   * @param opts.nameHint Optionally, provide a descriptive name for your new
	   * binding. We will mangle this name as needed to avoid collisions, but
	   * picking a good name here can aid in debugging.
	   *
	   * @return The name you can use in your template to access the imported value.
	   */
	  bindImport(moduleSpecifier, exportedName, target, opts) {
	    // This will discover or create the local name for accessing the given import.
	    let importedIdentifier = __classPrivateFieldGet(this, _JSUtils_importer, "f").import(__classPrivateFieldGet(this, _JSUtils_template, "f"), moduleSpecifier, exportedName, opts === null || opts === void 0 ? void 0 : opts.nameHint);
	    // Simple base case: the JS name that's available is also unused at our spot
	    // in HBS, so just use it.
	    if (!(0, hbs_utils_1.astNodeHasBinding)(target, importedIdentifier.name)) {
	      __classPrivateFieldGet(this, _JSUtils_addedBinding, "f").call(this, importedIdentifier.name);
	      return importedIdentifier.name;
	    }
	    // The importedIdentifier that we have in Javascript is not usable within
	    // our HBS because it's shadowed by a block param. So we will introduce a
	    // second name via a variable declaration.
	    //
	    // The reason we don't force the import itself to have this name is that
	    // we might be re-using an existing import, and we don't want to go
	    // rewriting all of its callsites that are unrelated to us.
	    let identifier = unusedNameLike(importedIdentifier.name, candidate => __classPrivateFieldGet(this, _JSUtils_template, "f").scope.hasBinding(candidate) || (0, hbs_utils_1.astNodeHasBinding)(target, candidate));
	    let t = __classPrivateFieldGet(this, _JSUtils_babel, "f").types;
	    let declaration = __classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_emitStatement).call(this, t.variableDeclaration('let', [t.variableDeclarator(t.identifier(identifier), importedIdentifier)]));
	    declaration.scope.registerBinding('let', declaration.get('declarations.0'));
	    __classPrivateFieldGet(this, _JSUtils_addedBinding, "f").call(this, identifier);
	    return identifier;
	  }
	  /**
	   * Add an import statement purely for side effect.
	   *
	   * @param moduleSpecifier the module to import
	   */
	  importForSideEffect(moduleSpecifier) {
	    __classPrivateFieldGet(this, _JSUtils_importer, "f").importForSideEffect(moduleSpecifier);
	  }
	  /**
	   * Emit a javascript expresison for side-effect. This only accepts
	   * expressions, not statements, because you should not introduce new bindings.
	   * To introduce a binding see bindExpression or bindImport instead.
	   *
	   * @param { Expression } expression A javascript expression whose value will
	   * initialize your new binding. See docs on the Expression type below for
	   * details.
	   */
	  emitExpression(expression) {
	    let t = __classPrivateFieldGet(this, _JSUtils_babel, "f").types;
	    __classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_emitStatement).call(this, t.expressionStatement(__classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_parseExpression).call(this, __classPrivateFieldGet(this, _JSUtils_state, "f").program, expression)));
	  }
	}
	jsUtils.JSUtils = JSUtils;
	_JSUtils_babel = new WeakMap(), _JSUtils_state = new WeakMap(), _JSUtils_template = new WeakMap(), _JSUtils_addedBinding = new WeakMap(), _JSUtils_importer = new WeakMap(), _JSUtils_instances = new WeakSet(), _JSUtils_emitStatement = function _JSUtils_emitStatement(statement) {
	  if (__classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath) {
	    __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath = __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath.insertAfter(statement)[0];
	  } else {
	    __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath = __classPrivateFieldGet(this, _JSUtils_state, "f").program.unshiftContainer('body', statement)[0];
	  }
	  return __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath;
	}, _JSUtils_parseExpression = function _JSUtils_parseExpression(target, expression) {
	  let expressionString;
	  if (typeof expression === 'string') {
	    expressionString = expression;
	  } else {
	    expressionString = expression(new ExpressionContext(__classPrivateFieldGet(this, _JSUtils_importer, "f"), target));
	  }
	  let parsed = __classPrivateFieldGet(this, _JSUtils_babel, "f").parse(expressionString);
	  if (!parsed) {
	    throw new Error(`JSUtils.bindExpression could not understand the expression: ${expressionString}`);
	  }
	  let statements = body(parsed);
	  if (statements.length !== 1) {
	    throw new Error(`JSUtils.bindExpression expected to find exactly one expression but found ${statements.length} in: ${expressionString}`);
	  }
	  let statement = statements[0];
	  if (statement.type !== 'ExpressionStatement') {
	    throw new Error(`JSUtils.bindExpression expected to find an expression but found ${statement.type} in: ${expressionString}`);
	  }
	  return statement.expression;
	};
	function unusedNameLike(desiredName, isUsed) {
	  let candidate = desiredName;
	  let counter = 0;
	  while (isUsed(candidate)) {
	    candidate = `${desiredName}${counter++}`;
	  }
	  return candidate;
	}
	function body(node) {
	  if (node.type === 'File') {
	    return node.program.body;
	  } else {
	    return node.body;
	  }
	}
	/**
	 * Allows you to construct an expression that relies on imported values.
	 */
	class ExpressionContext {
	  constructor(importer, target) {
	    _ExpressionContext_importer.set(this, void 0);
	    _ExpressionContext_target.set(this, void 0);
	    __classPrivateFieldSet(this, _ExpressionContext_importer, importer, "f");
	    __classPrivateFieldSet(this, _ExpressionContext_target, target, "f");
	  }
	  /**
	   * Find or create a local binding for the given import.
	   *
	   * @param moduleSpecifier The path to import from.
	   * @param exportedName The named export you wish to access, or "default" for
	   * the default export, or "*" for the namespace export.
	   * @param nameHint Optionally, provide a descriptive name for your new
	   * binding. We will mangle this name as needed to avoid collisions, but
	   * picking a good name here can aid in debugging.
	      * @return the local identifier for the imported value
	   */
	  import(moduleSpecifier, exportedName, nameHint) {
	    // this method in babel-import-util is the lower-level one that doesn't try
	    // to create valid references for us. It's our responsibility to do so. But
	    // that's OK here, because we have the same responsibility for every
	    // scope-bag identifier, not just the imported ones, and it will be easier
	    // to handle them all at once.
	    return __classPrivateFieldGet(this, _ExpressionContext_importer, "f").import(__classPrivateFieldGet(this, _ExpressionContext_target, "f"), moduleSpecifier, exportedName, nameHint).name;
	  }
	}
	_ExpressionContext_importer = new WeakMap(), _ExpressionContext_target = new WeakMap();
	return jsUtils;
}

const require$$4 = /*@__PURE__*/getAugmentedNamespace(_importSync40);

var publicTypes = {};

var hasRequiredPublicTypes;

function requirePublicTypes () {
	if (hasRequiredPublicTypes) return publicTypes;
	hasRequiredPublicTypes = 1;

	Object.defineProperty(publicTypes, "__esModule", {
	  value: true
	});
	return publicTypes;
}

var hasRequiredPlugin;

function requirePlugin () {
	if (hasRequiredPlugin) return plugin$1;
	hasRequiredPlugin = 1;
	(function (exports) {

		var __createBinding = plugin$1 && plugin$1.__createBinding || (Object.create ? function (o, m, k, k2) {
		  if (k2 === undefined) k2 = k;
		  var desc = Object.getOwnPropertyDescriptor(m, k);
		  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		    desc = {
		      enumerable: true,
		      get: function () {
		        return m[k];
		      }
		    };
		  }
		  Object.defineProperty(o, k2, desc);
		} : function (o, m, k, k2) {
		  if (k2 === undefined) k2 = k;
		  o[k2] = m[k];
		});
		var __exportStar = plugin$1 && plugin$1.__exportStar || function (m, exports) {
		  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
		};
		Object.defineProperty(exports, "__esModule", {
		  value: true
		});
		exports.makePlugin = makePlugin;
		const babel_import_util_1 = requireSrc();
		const expression_parser_1 = requireExpressionParser();
		const js_utils_1 = requireJsUtils();
		const scope_locals_1 = requireScopeLocals();
		const syntax_1 = require$$4;
		__exportStar(requirePublicTypes(), exports);
		const INLINE_PRECOMPILE_MODULES = [{
		  moduleName: 'ember-cli-htmlbars',
		  export: 'hbs',
		  allowTemplateLiteral: true
		}, {
		  moduleName: 'ember-cli-htmlbars-inline-precompile',
		  export: 'default',
		  allowTemplateLiteral: true
		}, {
		  moduleName: 'htmlbars-inline-precompile',
		  export: 'default',
		  allowTemplateLiteral: true
		}, {
		  moduleName: '@ember/template-compilation',
		  export: 'precompileTemplate',
		  enableScope: true
		}, {
		  moduleName: '@ember/template-compiler',
		  export: 'template',
		  enableScope: true,
		  rfc931Support: 'polyfilled'
		}];
		function normalizeOpts(options) {
		  var _a;
		  if (((_a = options.targetFormat) !== null && _a !== void 0 ? _a : 'wire') === 'wire') {
		    let {
		      compiler
		    } = options;
		    if (!compiler) {
		      throw new Error(`when targetFormat==="wire" you must set the compiler or compilerPath option`);
		    }
		    return Object.assign(Object.assign({
		      outputModuleOverrides: {},
		      enableLegacyModules: [],
		      transforms: []
		    }, options), {
		      targetFormat: 'wire',
		      compiler
		    });
		  } else {
		    return Object.assign(Object.assign({
		      outputModuleOverrides: {},
		      enableLegacyModules: [],
		      transforms: []
		    }, options), {
		      targetFormat: 'hbs'
		    });
		  }
		}
		function makePlugin(loadOptions) {
		  return function htmlbarsInlinePrecompile(babel) {
		    babel.types;
		    const plugin = {
		      visitor: {
		        Program: {
		          enter(path, state) {
		            state.normalizedOpts = normalizeOpts(loadOptions(state.opts));
		            state.templateFactory = templateFactoryConfig(state.normalizedOpts);
		            state.util = new babel_import_util_1.ImportUtil(babel, path);
		            state.program = path;
		            state.recursionGuard = new Set();
		          },
		          exit(_path, state) {
		            if (state.normalizedOpts.targetFormat === 'wire') {
		              for (let {
		                moduleName,
		                export: exportName
		              } of configuredModules(state)) {
		                state.util.removeImport(moduleName, exportName);
		              }
		            }
		          }
		        },
		        TaggedTemplateExpression(path, state) {
		          let tagPath = path.get('tag');
		          if (!tagPath.isIdentifier()) {
		            return;
		          }
		          let config = referencesInlineCompiler(tagPath, state);
		          if (!config) {
		            return;
		          }
		          if (!config.allowTemplateLiteral) {
		            throw path.buildCodeFrameError(`Attempted to use \`${tagPath.node.name}\` as a template tag, but it can only be called as a function with a string passed to it: ${tagPath.node.name}('content here')`);
		          }
		          if (path.node.quasi.expressions.length) {
		            throw path.buildCodeFrameError('placeholders inside a tagged template string are not supported');
		          }
		          let template = path.node.quasi.quasis.map(quasi => quasi.value.cooked).join('');
		          if (state.normalizedOpts.targetFormat === 'wire') {
		            insertCompiledTemplate(babel, state, state.normalizedOpts, template, path, {}, config, undefined);
		          } else {
		            insertTransformedTemplate(babel, state, template, path, {}, config, undefined);
		          }
		        },
		        CallExpression(path, state) {
		          let calleePath = path.get('callee');
		          if (!calleePath.isIdentifier()) {
		            return;
		          }
		          let config = referencesInlineCompiler(calleePath, state);
		          if (!config) {
		            return;
		          }
		          if (state.recursionGuard.has(path.node)) {
		            return;
		          }
		          if (path.get('arguments').length > 2) {
		            throw path.buildCodeFrameError(`${calleePath.node.name} can only be invoked with 2 arguments: the template string and any static options`);
		          }
		          let [firstArg, secondArg] = path.get('arguments');
		          let template;
		          switch (firstArg === null || firstArg === void 0 ? void 0 : firstArg.node.type) {
		            case 'StringLiteral':
		              template = firstArg.node.value;
		              break;
		            case 'TemplateLiteral':
		              if (firstArg.node.expressions.length) {
		                throw path.buildCodeFrameError('placeholders inside a template string are not supported');
		              } else {
		                template = firstArg.node.quasis.map(quasi => quasi.value.cooked).join('');
		              }
		              break;
		            case 'TaggedTemplateExpression':
		              throw path.buildCodeFrameError(`tagged template strings inside ${calleePath.node.name} are not supported`);
		            default:
		              throw path.buildCodeFrameError(`${calleePath.node.name} should be invoked with at least a single argument (the template string)`);
		          }
		          let userTypedOptions;
		          let backingClass;
		          if (!secondArg) {
		            userTypedOptions = {};
		          } else {
		            if (!secondArg.isObjectExpression()) {
		              throw path.buildCodeFrameError(`${calleePath.node.name} can only be invoked with 2 arguments: the template string, and any static options`);
		            }
		            userTypedOptions = new expression_parser_1.ExpressionParser(babel).parseObjectExpression(calleePath.node.name, secondArg, config.enableScope, Boolean(config.rfc931Support));
		            if (config.rfc931Support && userTypedOptions.component) {
		              backingClass = userTypedOptions.component;
		            }
		          }
		          if (state.normalizedOpts.targetFormat === 'wire') {
		            insertCompiledTemplate(babel, state, state.normalizedOpts, template, path, userTypedOptions, config, backingClass);
		          } else {
		            insertTransformedTemplate(babel, state, template, path, userTypedOptions, config, backingClass);
		          }
		        }
		      }
		    };
		    return {
		      pre(file) {
		        // run our processing in pre so that imports for gts
		        // are kept for other plugins.
		        babel.traverse(file.ast, plugin.visitor, file.scope, this);
		      },
		      visitor: {}
		    };
		  };
		}
		function* configuredModules(state) {
		  for (let moduleConfig of INLINE_PRECOMPILE_MODULES) {
		    if (moduleConfig.moduleName !== '@ember/template-compilation' && moduleConfig.moduleName !== '@ember/template-compiler' && !state.normalizedOpts.enableLegacyModules.includes(moduleConfig.moduleName)) {
		      continue;
		    }
		    yield moduleConfig;
		  }
		}
		function referencesInlineCompiler(path, state) {
		  for (let moduleConfig of configuredModules(state)) {
		    if (path.referencesImport(moduleConfig.moduleName, moduleConfig.export)) {
		      return moduleConfig;
		    }
		  }
		  return undefined;
		}
		function runtimeErrorIIFE(babel, replacements) {
		  let statement = babel.template(`(function() {\n  throw new Error('ERROR_MESSAGE');\n})();`)(replacements);
		  return statement.expression;
		}
		function buildScopeLocals(userTypedOptions, formatOptions, target, mayUseLexicalThis) {
		  if (formatOptions.rfc931Support && userTypedOptions.eval) {
		    return new scope_locals_1.ScopeLocals({
		      mode: 'implicit',
		      jsPath: target,
		      mayUseLexicalThis
		    });
		  } else if (userTypedOptions.scope) {
		    return userTypedOptions.scope;
		  } else {
		    return new scope_locals_1.ScopeLocals({
		      mode: 'explicit'
		    });
		  }
		}
		function buildPrecompileOptions(babel, target, state, template, userTypedOptions, config, scope) {
		  let jsutils = new js_utils_1.JSUtils(babel, state, target, scope.add.bind(scope), state.util);
		  let meta = Object.assign({
		    jsutils
		  }, userTypedOptions === null || userTypedOptions === void 0 ? void 0 : userTypedOptions.meta);
		  let output = {
		    contents: template,
		    // we've extended meta to add jsutils, but the types in @glimmer/syntax
		    // don't account for extension
		    meta: meta,
		    // TODO: embroider's template-compiler allows this to be overriden to get
		    // backward-compatible module names that don't match the real name of the
		    // on-disk file. What's our plan for migrating people away from that?
		    moduleName: state.filename,
		    // This is here so it's *always* the real filename. Historically, there is
		    // also `moduleName` but that did not match the real on-disk filename, it
		    // was the notional runtime module name from classic ember builds.
		    filename: state.filename,
		    plugins: {
		      // the cast is needed here only because our meta is extended. That is,
		      // these plugins can access meta.jsutils.
		      ast: [...state.normalizedOpts.transforms, scope.crawl()]
		    }
		  };
		  for (let [key, value] of Object.entries(userTypedOptions)) {
		    if (key !== 'scope') {
		      // `scope` in the user-facing API becomes `locals` in the low-level
		      // ember-template-compiler API
		      output[key] = value;
		    }
		  }
		  output.locals = scope.locals;
		  if (config.rfc931Support) {
		    output.strictMode = true;
		  }
		  return output;
		}
		function remapAndBindIdentifiers(target, babel, scopeLocals) {
		  target.traverse({
		    Identifier(path) {
		      var _a;
		      if (scopeLocals.has(path.node.name) && path.node.name !== scopeLocals.get(path.node.name)) {
		        // this identifier has different names in hbs vs js, so we need to
		        // replace the hbs name in the template compiler output with the js
		        // name
		        path.replaceWith(babel.types.identifier(scopeLocals.get(path.node.name)));
		      }
		      // this is where we tell babel's scope system about the new reference we
		      // just introduced. @babel/plugin-transform-typescript in particular
		      // cares a lot about those references being present.
		      (_a = path.scope.getBinding(path.node.name)) === null || _a === void 0 ? void 0 : _a.reference(path);
		    }
		  });
		}
		function insertCompiledTemplate(babel, state, opts, template, target, userTypedOptions, config, backingClass) {
		  let t = babel.types;
		  let scopeLocals = buildScopeLocals(userTypedOptions, config, target, !backingClass);
		  let options = buildPrecompileOptions(babel, target, state, template, userTypedOptions, config, scopeLocals);
		  let precompileResultString;
		  // insertRuntimeErrors is legacy and not supported by the newer rfc931 form
		  if (options.insertRuntimeErrors && !config.rfc931Support) {
		    try {
		      precompileResultString = opts.compiler.precompile(template, options);
		    } catch (error) {
		      target.replaceWith(runtimeErrorIIFE(babel, {
		        ERROR_MESSAGE: error.message
		      }));
		      return;
		    }
		  } else {
		    precompileResultString = opts.compiler.precompile(template, options);
		  }
		  let templateExpression = babel.template.expression.ast(precompileResultString);
		  t.addComment(templateExpression, 'leading', `\n  ${template.replace(/\*\//g, '*\\/')}\n`, /* line comment? */false);
		  state.util.replaceWith(target, i => {
		    var _a;
		    let templateFactoryIdentifier = i.import(state.templateFactory.moduleName, state.templateFactory.exportName);
		    let expression = t.callExpression(templateFactoryIdentifier, [templateExpression]);
		    if (config.rfc931Support) {
		      expression = t.callExpression(i.import('@ember/component', 'setComponentTemplate'), [expression, (_a = backingClass === null || backingClass === void 0 ? void 0 : backingClass.node) !== null && _a !== void 0 ? _a : t.callExpression(i.import('@ember/component/template-only', 'default', 'templateOnly'), [])]);
		    }
		    return expression;
		  });
		  remapAndBindIdentifiers(target, babel, scopeLocals);
		}
		function insertTransformedTemplate(babel, state, template, target, userTypedOptions, formatOptions, backingClass) {
		  let t = babel.types;
		  let scopeLocals = buildScopeLocals(userTypedOptions, formatOptions, target, !backingClass);
		  let options = buildPrecompileOptions(babel, target, state, template, userTypedOptions, formatOptions, scopeLocals);
		  let ast = (0, syntax_1.preprocess)(template, Object.assign(Object.assign({}, options), {
		    mode: 'codemod'
		  }));
		  let transformed = (0, syntax_1.print)(ast, {
		    entityEncoding: 'raw'
		  });
		  if (target.isCallExpression()) {
		    updateCallForm(target, transformed, formatOptions, scopeLocals, state, babel, backingClass);
		  } else {
		    updateBacktickForm(scopeLocals, state, target, t, transformed, babel);
		  }
		}
		function updateBacktickForm(scopeLocals, state, target, t, transformed, babel) {
		  if (scopeLocals.isEmpty()) {
		    // simple case: just replace the string literal part with the transformed
		    // template contents
		    target.get('quasi').get('quasis.0').replaceWith(t.templateElement({
		      raw: transformed
		    }));
		    return;
		  }
		  // need to add scope, so need to replace the backticks form with a call
		  // expression to precompileTemplate
		  maybePruneImport(state.util, target.get('tag'));
		  let newCall = state.util.replaceWith(target, i => t.callExpression(precompileTemplate(i), [t.stringLiteral(transformed)]));
		  updateScope(babel, newCall, scopeLocals);
		}
		function updateCallForm(target, transformed, formatOptions, scopeLocals, state, babel, backingClass) {
		  // first the simple part: replacing the string literal with the actual body of
		  // the rewritten template
		  target.get('arguments.0').replaceWith(babel.types.stringLiteral(transformed));
		  if (!formatOptions.enableScope && !scopeLocals.isEmpty()) {
		    // an AST transform added lexically scoped values to a template that
		    // wasn't already in a form that supports them, so convert form.
		    maybePruneImport(state.util, target.get('callee'));
		    state.util.replaceWith(target.get('callee'), i => precompileTemplate(i));
		  }
		  if (formatOptions.rfc931Support === 'polyfilled') {
		    maybePruneImport(state.util, target.get('callee'));
		    state.util.replaceWith(target.get('callee'), i => precompileTemplate(i));
		    convertStrictMode(babel, target);
		    removeEvalAndScope(target);
		    target.node.arguments = target.node.arguments.slice(0, 2);
		    state.recursionGuard.add(target.node);
		    state.util.replaceWith(target, i => {
		      var _a;
		      return babel.types.callExpression(i.import('@ember/component', 'setComponentTemplate'), [target.node, (_a = backingClass === null || backingClass === void 0 ? void 0 : backingClass.node) !== null && _a !== void 0 ? _a : babel.types.callExpression(i.import('@ember/component/template-only', 'default', 'templateOnly'), [])]);
		    });
		    // we just wrapped the target callExpression in the call to
		    // setComponentTemplate. Adjust `target` back to point at the
		    // precompileTemplate call for the final updateScope below.
		    //
		    target = target.get('arguments.0');
		  }
		  // We deliberately do updateScope at the end so that when it updates
		  // references, those references will point to the accurate paths in the
		  // final AST.
		  updateScope(babel, target, scopeLocals);
		}
		function templateFactoryConfig(opts) {
		  var _a;
		  let moduleName = '@ember/template-factory';
		  let exportName = 'createTemplateFactory';
		  let overrides = (_a = opts.outputModuleOverrides[moduleName]) === null || _a === void 0 ? void 0 : _a[exportName];
		  return overrides ? {
		    exportName: overrides[0],
		    moduleName: overrides[1]
		  } : {
		    exportName,
		    moduleName
		  };
		}
		function buildScope(babel, locals) {
		  let t = babel.types;
		  return t.arrowFunctionExpression([], t.objectExpression(locals.entries().map(([name, identifier]) => t.objectProperty(t.identifier(name), t.identifier(identifier), false, name !== 'this'))));
		}
		// this is responsible both for adjusting the AST for our scope argument *and*
		// ensuring that babel's scope system will see that these new identifiers
		// reference their bindings. @babel/plugin-transform-typescript in particular
		// cares an awful lot about whether an import has valid non-type references, so
		// these newly introducd references need to be valid.
		function updateScope(babel, target, locals) {
		  let t = babel.types;
		  let secondArg = target.get('arguments.1');
		  if (secondArg) {
		    let scope = secondArg.get('properties').find(p => {
		      let key = p.get('key');
		      return key.isIdentifier() && key.node.name === 'scope';
		    });
		    if (scope) {
		      if (locals.isEmpty()) {
		        scope.remove();
		      } else {
		        scope.set('value', buildScope(babel, locals));
		        // funny-looking naming here, but it actually makes sense because we're
		        // connecting the glimmer scope system with the babel scope system.
		        scope.scope.crawl();
		      }
		    } else if (!locals.isEmpty()) {
		      secondArg.pushContainer('properties', t.objectProperty(t.identifier('scope'), buildScope(babel, locals)));
		      secondArg.get(`properties.${secondArg.node.properties.length - 1}`).scope.crawl();
		    }
		  } else if (!locals.isEmpty()) {
		    target.pushContainer('arguments', t.objectExpression([t.objectProperty(t.identifier('scope'), buildScope(babel, locals))]));
		    target.get('arguments.1').scope.crawl();
		  }
		}
		function removeEvalAndScope(target) {
		  let secondArg = target.get('arguments.1');
		  if (secondArg) {
		    let evalProp = secondArg.get('properties').find(p => {
		      let key = p.get('key');
		      return key.isIdentifier() && key.node.name === 'eval';
		    });
		    if (evalProp) {
		      evalProp.remove();
		    }
		    let componentProp = secondArg.get('properties').find(p => {
		      let key = p.get('key');
		      return key.isIdentifier() && key.node.name === 'component';
		    });
		    if (componentProp) {
		      componentProp.remove();
		    }
		  }
		}
		// Given a call to template(), convert its "strict" argument into
		// precompileTemplate's "strictMode" argument. They differ in name and default
		// value.
		function convertStrictMode(babel, target) {
		  let t = babel.types;
		  let secondArg = target.get('arguments.1');
		  if (secondArg) {
		    let strict = secondArg.get('properties').find(p => {
		      let key = p.get('key');
		      return key.isIdentifier() && key.node.name === 'strict';
		    });
		    if (strict) {
		      strict.set('key', t.identifier('strictMode'));
		    } else {
		      secondArg.pushContainer('properties', t.objectProperty(t.identifier('strictMode'), t.booleanLiteral(true)));
		    }
		  } else {
		    target.pushContainer('arguments', t.objectExpression([t.objectProperty(t.identifier('strictMode'), t.booleanLiteral(true))]));
		  }
		}
		function maybePruneImport(util, identifier) {
		  if (!identifier.isIdentifier()) {
		    return;
		  }
		  let binding = identifier.scope.getBinding(identifier.node.name);
		  if (!binding) {
		    return;
		  }
		  let found = binding.referencePaths.find(path => path.node === identifier.node);
		  if (!found) {
		    return;
		  }
		  binding.referencePaths.splice(binding.referencePaths.indexOf(found), 1);
		  binding.references--;
		  if (binding.references === 0) {
		    let specifier = binding.path;
		    if (specifier.isImportSpecifier()) {
		      let declaration = specifier.parentPath;
		      util.removeImport(declaration.node.source.value, name(specifier.node.imported));
		    }
		  }
		}
		function precompileTemplate(i) {
		  return i.import('@ember/template-compilation', 'precompileTemplate');
		}
		function name(node) {
		  if (node.type === 'StringLiteral') {
		    return node.value;
		  } else {
		    return node.name;
		  }
		}
		exports.default = makePlugin(options => options); 
	} (plugin$1));
	return plugin$1;
}

var pluginExports = requirePlugin();
const babelPluginEmberTemplateCompilation = /*@__PURE__*/getDefaultExportFromCjs(pluginExports);

const plugin = /*#__PURE__*/_mergeNamespaces({
    __proto__: null,
    default: babelPluginEmberTemplateCompilation
}, [pluginExports]);

export { babelPluginEmberTemplateCompilation as b, plugin as p };
