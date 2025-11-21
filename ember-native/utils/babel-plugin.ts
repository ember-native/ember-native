import { parse, type PluginObj } from '@babel/core';
import type * as Babel from '@babel/core';
import type { types } from '@babel/core';
import * as glimmer from '@glimmer/syntax';
import { ASTv1, type NodeVisitor, WalkerPath } from '@glimmer/syntax';
import { ImportUtil } from 'babel-import-util';

interface ASTPluginEnvironment {
  locals: string[];
  filename: string;
}

class HotAstProcessor {
  options = {
    itsStatic: false,
  };
  counter = 0;
  meta = {
    locals: new Set<string>(),
    importVar: null,
    babelProgram: undefined,
    importBindings: new Set<string>(),
  } as {
    locals: Set<string>;
    importVar: any;
    importBindings: Set<string>;
    babelProgram?: types.Program;
  };
  didCreateImportClass: boolean = false;

  constructor() {
    this.transform = this.transform.bind(this);
  }

  reset() {
    this.meta.importVar = null;
    this.meta.babelProgram = undefined;
    this.meta.importBindings = new Set<string>();
  }

  transform(env: ASTPluginEnvironment): any {
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
    if (env.filename?.includes('node_modules')) {
      return {
        visitor: {},
      };
    }
    const meta = this.meta as Required<typeof this.meta>;
    const importVar = (env as any).meta.jsutils.bindExpression(
      meta.importVar || 'null',
      null,
      {
        nameHint: 'template__imports__',
      },
    );
    meta.importVar = meta.importVar || importVar;
    return {
      visitor: {
        ...this.buildVisitor({
          importVar,
          importBindings: meta.importBindings,
          babelProgram: meta.babelProgram,
        }),
      },
    };
  }

  buildVisitor({
    importVar,
    importBindings,
    babelProgram,
  }: {
    importVar: string;
    importBindings: Set<string>;
    babelProgram: types.Program;
  }) {
    const findImport = function findImport(specifier: string) {
      return babelProgram.body.find(
        (b) =>
          b.type === 'ImportDeclaration' &&
          b.specifiers.some((s) => s.local.name === specifier),
      );
    };

    const findBlockParams = function (
      expression: string,
      p: WalkerPath<
        | ASTv1.BlockStatement
        | ASTv1.Block
        | ASTv1.ElementNode
        | ASTv1.PathExpression
      >,
    ): boolean {
      if ((p.node as any).type === 'Template') {
        return false;
      }
      if (
        p.node &&
        p.node.type === 'BlockStatement' &&
        p.node.program.blockParams.includes(expression)
      ) {
        return true;
      }
      const node = p.node as any;
      if (node && node.blockParams && node.blockParams.includes(expression)) {
        return true;
      }
      if (!p.parent) return false;
      return findBlockParams(expression, p.parent as any);
    };
    const visitor: NodeVisitor = {
      PathExpression: (node, p) => {
        if (
          (p.parentNode?.type === 'SubExpression' ||
            p.parentNode?.type === 'MustacheStatement') &&
          p.parentNode.params.includes(node)
        ) {
          return;
        }
        const original = node.original.split('.')[0];
        if (original === 'this') return;
        if (original.startsWith('@')) return;
        if (original === 'block') return;
        if (original.startsWith('this.')) return;
        if (findBlockParams(original, p)) return;
        if (
          node.original === 'helper' ||
          node.original === 'component' ||
          node.original === 'modifier'
        ) {
          const parent = p.parentNode as ASTv1.MustacheStatement;
          if (
            typeof (parent.params[0] as ASTv1.StringLiteral).original !==
            'string'
          ) {
            return;
          }
          const original = (
            parent.params[0] as ASTv1.StringLiteral
          ).original.split('.')[0];
          if (original && findBlockParams(original, p)) return;
          if (original?.includes('.')) return;
          if (!original) return;
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
      ElementNode: (
        element: ASTv1.ElementNode,
        p: WalkerPath<ASTv1.ElementNode>,
      ) => {
        const original = element.tag.split('.')[0];
        if (findBlockParams(original, p)) return;
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

export const hotAstProcessor = new HotAstProcessor();

export default function hotReplaceAst(babel: typeof Babel) {
  const t = babel.types;
  return {
    name: 'a-hot-reload-imports',
    pre(file) {
      hotAstProcessor.reset();
      hotAstProcessor.meta.babelProgram = file.ast.program;
    },
    visitor: {
      Program(path, state) {
        if (!hotAstProcessor.meta.importVar) {
          return;
        }
        if (process.env['EMBER_HMR_ENABLED'] !== 'true') {
          return;
        }
        if (state.filename?.includes('node_modules')) {
          return;
        }
        const util = new ImportUtil(babel, path);
        const tracked = util.import(path, '@glimmer/tracking', 'tracked');
        const klass = t.classExpression(
          path.scope.generateUidIdentifier('Imports'),
          null,
          t.classBody([]),
        );
        const bindings = [...hotAstProcessor.meta.importBindings].sort();
        for (const local of bindings) {
          klass.body.body.push(
            t.classProperty(t.identifier(local), t.identifier(local), null, [
              t.decorator(tracked),
            ]),
          );
        }

        const newExp = t.newExpression(klass, []);
        const assign = t.assignmentExpression(
          '=',
          t.identifier(hotAstProcessor.meta.importVar),
          newExp,
        );

        const varDeclaration =
          path.node.body.findIndex(
            (e) =>
              e.type === 'VariableDeclaration' &&
              (e.declarations[0].id as any).name ===
                hotAstProcessor.meta.importVar,
          ) + 1;

        const lastImportIndex =
          [...path.node.body].findLastIndex(
            (e) =>
              e.type === 'ImportDeclaration',
          ) + 1;

        path.node.body.splice(
          Math.max(varDeclaration, lastImportIndex),
          0,
          assign as any,
        );

        const findImport = function findImport(specifier: string) {
          return path.node.body.find(
            (b) =>
              b.type === 'ImportDeclaration' &&
              b.specifiers.some((s) => s.local.name === specifier),
          );
        };

        const ifHotStatements = [];
        for (const imp of bindings) {
          const importDeclaration = findImport(
            imp,
          ) as any;
          if (!importDeclaration) {
            console.log('could not find import for ', imp);
            continue;
          }
          const source = importDeclaration.source.value;
          // const timestamp = Date.now();
          const ast = parse(
            `
          import.meta.webpackHot.accept('${source}', function () {
            ${hotAstProcessor.meta.importVar}.${imp} = ${imp};
          });
          `,
            {
              babelrc: false,
              configFile: false,
            },
          );
          const accept = ast.program.body;
          ifHotStatements.push(...accept);
        }
        const ifHot = t.ifStatement(
          t.memberExpression(
            t.metaProperty(t.identifier('import'), t.identifier('meta')),
            t.identifier('webpackHot'),
          ),
          t.blockStatement([...ifHotStatements]),
        );
        path.node.body.push(ifHot as any);
        path.scope.crawl();
      },
    },
  } as PluginObj;
}
