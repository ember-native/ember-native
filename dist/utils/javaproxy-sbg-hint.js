/**
 * NativeScript's Static Binding Generator (SBG) scans built app JS for the
 * literal `SomeNativeClass.extend("java.Class.Name", { methodA(){}, ... })`
 * call pattern to generate a matching native (Java) stub class at build
 * time - a pure AST/text scan requiring both arguments to be literals
 * (confirmed by reading a real app's
 * `platforms/android/build-tools/jsparser/js_parser.js` directly: it
 * explicitly requires `isStringLiteral`/`isObjectExpression` on the two
 * arguments, and bails out otherwise).
 *
 * `global.JavaProxy` (from `@nativescript/android`'s `ts_helpers.js`,
 * exposed as a TypeScript class decorator - see that file's own
 * `global.JavaProxy = JavaProxy` line) is a different, indirect convention:
 * `@JavaProxy(name)` compiles to `X = __decorate([JavaProxy(name)], X)`,
 * and the *actual* `.extend()` call happens inside `ts_helpers.js`'s own
 * `JavaProxy` factory (`target.extend(className, target.prototype)`) - not
 * as literal text at the `__decorate(...)` call site, and with `.prototype`
 * (a property access, not an object literal) as the second argument even
 * where it does appear. SBG's parser can't trace either indirection, so it
 * silently generates no native stub for any class registered this way.
 * `@nativescript/core`'s own `application.android.js` uses this exact
 * pattern for `NativeScriptLifecycleCallbacksImpl`/
 * `NativeScriptComponentCallbacksImpl` - `Application.run()` then throws
 * `LookedUpClassNotFound` synchronously at boot in every release build that
 * doesn't already have some other route to a matching stub.
 *
 * `@nativescript/vite` already has a similar, narrower fix
 * (`helpers/nativeclass-transform.js`) for its own `@NativeClass()`
 * decorator convention, confirmed by its own comments ("SBG expects the
 * __decorate call to be INSIDE the IIFE... the IIFE pattern with
 * __decorate inside is correct") - but that transform's own guard
 * (`/\bNativeClass\b/`) never matches `JavaProxy`, so it doesn't cover this
 * case. This is the equivalent fix for `@JavaProxy`, generalized to any
 * `X = __decorate([JavaProxy("name")], X)` site (not hardcoded to the two
 * known `@nativescript/core` classes), so it also covers similar code in any
 * other dependency, and stays correct automatically if `@nativescript/core`
 * ever adds/renames a method on either class (the method list is read from
 * the actual source, not hand-copied).
 *
 * Fix: for each such site, walk the enclosing IIFE
 * (`(function (_super) { ...; X = __decorate(...); return X; }(SuperExpr))`)
 * to find `X.prototype.<method> = function ... {}` assignments and the
 * `SuperExpr` the IIFE was invoked with, then append a dead-code hint
 * statement - `if (globalThis.<guard>) { (SuperExpr).extend("name", {
 * method(){}, ... }); }` - using the *original source text* for `SuperExpr`
 * so it resolves to the exact same qualified native-class reference SBG
 * needs. The condition is a dynamic property read Rollup's tree-shaking
 * can't prove is always false, so the hint text survives bundling for SBG
 * to find, but the branch never actually executes (avoiding any
 * duplicate-registration risk against the real `@JavaProxy`-driven
 * registration for the same class names).
 */

const ts = require('typescript');

const GUARD = '__sbgJavaProxyHintNeverTrue__';

function findPrototypeMethods(fnBody, targetName) {
  const methods = [];
  for (const stmt of fnBody.statements) {
    if (
      !ts.isExpressionStatement(stmt) ||
      !ts.isBinaryExpression(stmt.expression) ||
      stmt.expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken
    ) {
      continue;
    }
    const left = stmt.expression.left;
    if (
      ts.isPropertyAccessExpression(left) &&
      ts.isPropertyAccessExpression(left.expression) &&
      ts.isIdentifier(left.expression.expression) &&
      left.expression.expression.text === targetName &&
      left.expression.name.text === 'prototype'
    ) {
      methods.push(left.name.text);
    }
  }
  return methods;
}

function findEnclosingIifeSuperExpr(node, sourceFile) {
  let fn = node.parent;
  while (fn && !ts.isFunctionExpression(fn)) fn = fn.parent;
  if (!fn) return null;

  let call = fn.parent;
  // `(function (_super) {...}(SuperExpr))` - the parenthesization wraps the
  // whole call, not just the function, so `fn.parent` is the CallExpression
  // directly; tolerate an extra ParenthesizedExpression layer too, in case a
  // future @nativescript/core release formats this differently.
  if (call && ts.isParenthesizedExpression(call)) call = call.parent;
  if (!call || !ts.isCallExpression(call) || call.expression !== fn || call.arguments.length < 1) {
    return null;
  }

  const superExprNode = call.arguments[0];
  return {
    fnBody: fn.body,
    superExprText: sourceFile.text.slice(superExprNode.getStart(sourceFile), superExprNode.getEnd()),
  };
}

function collectJavaProxyHints(sourceFile) {
  const hints = [];

  function visit(node) {
    if (
      ts.isExpressionStatement(node) &&
      ts.isBinaryExpression(node.expression) &&
      node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      const { left, right } = node.expression;
      if (
        ts.isIdentifier(left) &&
        ts.isCallExpression(right) &&
        ts.isIdentifier(right.expression) &&
        right.expression.text === '__decorate' &&
        right.arguments.length >= 2 &&
        ts.isArrayLiteralExpression(right.arguments[0]) &&
        right.arguments[0].elements.length === 1 &&
        ts.isIdentifier(right.arguments[1]) &&
        right.arguments[1].text === left.text
      ) {
        const decorator = right.arguments[0].elements[0];
        if (
          ts.isCallExpression(decorator) &&
          ts.isIdentifier(decorator.expression) &&
          decorator.expression.text === 'JavaProxy' &&
          decorator.arguments.length === 1 &&
          ts.isStringLiteral(decorator.arguments[0])
        ) {
          const iife = findEnclosingIifeSuperExpr(node, sourceFile);
          if (iife) {
            const methods = findPrototypeMethods(iife.fnBody, left.text);
            if (methods.length > 0) {
              hints.push({
                className: decorator.arguments[0].text,
                superExprText: iife.superExprText,
                methods,
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hints;
}

/**
 * @param {string} code
 * @param {string} id
 * @returns {string|null} the transformed code, or null if this file has no
 *   `@JavaProxy`-decorated classes to hint.
 */
function javaProxySbgHint(code, id) {
  // Fast pre-filter before parsing - same pattern as @nativescript/vite's
  // own nativeclass-transform.js.
  if (!/__decorate[a-zA-Z$]*\s*\(/.test(code) || !/\bJavaProxy\b/.test(code)) return null;

  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const hints = collectJavaProxyHints(sourceFile);
  if (hints.length === 0) return null;

  const hintStatements = hints
    .map(({ superExprText, className, methods }) => {
      const methodStubs = methods.map((m) => `${JSON.stringify(m)}: function () {}`).join(', ');
      return `(${superExprText}).extend(${JSON.stringify(className)}, { ${methodStubs} });`;
    })
    .join('\n  ');

  return `${code}\nif (globalThis.${GUARD}) {\n  ${hintStatements}\n}\n`;
}

module.exports = function javaProxySbgHintPlugin() {
  return {
    name: 'ember-native-javaproxy-sbg-hint',
    transform(code, id) {
      const transformed = javaProxySbgHint(code, id);
      return transformed === null ? null : { code: transformed, map: null };
    },
  };
};

module.exports.javaProxySbgHint = javaProxySbgHint;
