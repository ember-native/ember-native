"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotAstProcessor = void 0;
exports.default = hotReplaceAst;
const core_1 = require("@babel/core");
const glimmer = require("@glimmer/syntax");
const babel_import_util_1 = require("babel-import-util");
class HotAstProcessor {
    constructor() {
        this.options = {
            itsStatic: false,
        };
        this.counter = 0;
        this.meta = {
            locals: new Set(),
            importVar: null,
            babelProgram: undefined,
            importBindings: new Set(),
        };
        this.didCreateImportClass = false;
        this.transform = this.transform.bind(this);
    }
    reset() {
        this.meta.importVar = null;
        this.meta.babelProgram = undefined;
        this.meta.importBindings = new Set();
    }
    transform(env) {
        var _a;
        if (process.env['EMBER_HMR_ENABLED'] !== 'true') {
            return {
                visitor: {},
            };
        }
        if (!this.meta.babelProgram) {
            return {
                visitor: {},
            };
        }
        if ((_a = env.filename) === null || _a === void 0 ? void 0 : _a.includes('node_modules')) {
            return {
                visitor: {},
            };
        }
        const meta = this.meta;
        const importVar = env.meta.jsutils.bindExpression(meta.importVar || 'null', null, {
            nameHint: 'template__imports__',
        });
        meta.importVar = meta.importVar || importVar;
        return {
            visitor: Object.assign({}, this.buildVisitor({
                importVar,
                importBindings: meta.importBindings,
                babelProgram: meta.babelProgram,
            })),
        };
    }
    buildVisitor({ importVar, importBindings, babelProgram, }) {
        const findImport = function findImport(specifier) {
            return babelProgram.body.find((b) => b.type === 'ImportDeclaration' &&
                b.specifiers.some((s) => s.local.name === specifier));
        };
        const findBlockParams = function (expression, p) {
            if (p.node.type === 'Template') {
                return false;
            }
            if (p.node &&
                p.node.type === 'BlockStatement' &&
                p.node.program.blockParams.includes(expression)) {
                return true;
            }
            const node = p.node;
            if (node && node.blockParams && node.blockParams.includes(expression)) {
                return true;
            }
            if (!p.parent)
                return false;
            return findBlockParams(expression, p.parent);
        };
        const visitor = {
            PathExpression: (node, p) => {
                var _a, _b;
                if ((((_a = p.parentNode) === null || _a === void 0 ? void 0 : _a.type) === 'SubExpression' ||
                    ((_b = p.parentNode) === null || _b === void 0 ? void 0 : _b.type) === 'MustacheStatement') &&
                    p.parentNode.params.includes(node)) {
                    return;
                }
                const original = node.original.split('.')[0];
                if (original === 'this')
                    return;
                if (original.startsWith('@'))
                    return;
                if (original === 'block')
                    return;
                if (original.startsWith('this.'))
                    return;
                if (findBlockParams(original, p))
                    return;
                if (node.original === 'helper' ||
                    node.original === 'component' ||
                    node.original === 'modifier') {
                    const parent = p.parentNode;
                    if (typeof parent.params[0].original !==
                        'string') {
                        return;
                    }
                    const original = parent.params[0].original.split('.')[0];
                    if (original && findBlockParams(original, p))
                        return;
                    if (original === null || original === void 0 ? void 0 : original.includes('.'))
                        return;
                    if (!original)
                        return;
                    if (findImport(original)) {
                        const param = glimmer.builders.path(`${importVar}.${original}`);
                        parent.params.splice(0, 1, param);
                        importBindings.add(original);
                    }
                    return;
                }
                if (importVar) {
                    if (findImport(node.original)) {
                        node.original = `${importVar}.${node.original}`;
                        node.parts = node.original.split('.');
                        importBindings.add(original);
                    }
                    return;
                }
            },
            ElementNode: (element, p) => {
                const original = element.tag.split('.')[0];
                if (findBlockParams(original, p))
                    return;
                if (importVar) {
                    if (findImport(original)) {
                        element.tag = `${importVar}.${original}`;
                        p.node.tag = element.tag;
                        importBindings.add(original);
                    }
                    return;
                }
            },
        };
        return visitor;
    }
}
exports.hotAstProcessor = new HotAstProcessor();
function hotReplaceAst(babel) {
    const t = babel.types;
    return {
        name: 'a-hot-reload-imports',
        pre(file) {
            exports.hotAstProcessor.reset();
            exports.hotAstProcessor.meta.babelProgram = file.ast.program;
        },
        visitor: {
            Program(path, state) {
                var _a;
                if (!exports.hotAstProcessor.meta.importVar) {
                    return;
                }
                if (process.env['EMBER_HMR_ENABLED'] !== 'true') {
                    return;
                }
                if ((_a = state.filename) === null || _a === void 0 ? void 0 : _a.includes('node_modules')) {
                    return;
                }
                const util = new babel_import_util_1.ImportUtil(babel, path);
                const tracked = util.import(path, '@glimmer/tracking', 'tracked');
                const klass = t.classExpression(path.scope.generateUidIdentifier('Imports'), null, t.classBody([]));
                const bindings = [...exports.hotAstProcessor.meta.importBindings].sort();
                for (const local of bindings) {
                    klass.body.body.push(t.classProperty(t.identifier(local), t.identifier(local), null, [
                        t.decorator(tracked),
                    ]));
                }
                const newExp = t.newExpression(klass, []);
                const assign = t.assignmentExpression('=', t.identifier(exports.hotAstProcessor.meta.importVar), newExp);
                const varDeclaration = path.node.body.findIndex((e) => e.type === 'VariableDeclaration' &&
                    e.declarations[0].id.name ===
                        exports.hotAstProcessor.meta.importVar) + 1;
                const lastImportIndex = [...path.node.body].findLastIndex((e) => e.type === 'ImportDeclaration') + 1;
                path.node.body.splice(Math.max(varDeclaration, lastImportIndex), 0, assign);
                const findImport = function findImport(specifier) {
                    return path.node.body.find((b) => b.type === 'ImportDeclaration' &&
                        b.specifiers.some((s) => s.local.name === specifier));
                };
                const ifHotStatements = [];
                console.log('bindings', bindings);
                for (const imp of bindings) {
                    console.log('imp', imp);
                    const importDeclaration = findImport(imp);
                    if (!importDeclaration) {
                        console.log('could not find import for ', imp);
                        continue;
                    }
                    const source = importDeclaration.source.value;
                    // const timestamp = Date.now();
                    const ast = (0, core_1.parse)(`
          import.meta.webpackHot.accept('${source}', function () {
            ${exports.hotAstProcessor.meta.importVar}.${imp} = ${imp};
          });
          `);
                    const accept = ast.program.body;
                    ifHotStatements.push(...accept);
                }
                const ifHot = t.ifStatement(t.memberExpression(t.metaProperty(t.identifier('import'), t.identifier('meta')), t.identifier('webpackHot')), t.blockStatement([...ifHotStatements]));
                path.node.body.push(ifHot);
                path.scope.crawl();
            },
        },
    };
}
