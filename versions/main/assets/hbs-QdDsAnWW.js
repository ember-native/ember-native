import { i as it$1, X as Xe$1, I as Ie, t as te, o as ot$1, r as rt$1, a as t, b as r, c as at$1, x, P, n, j, Z as Zt$1 } from './index-Bhthv0jx.js';
import { n as nameFor, s as setComponentTemplate, t as templateOnly, o as on, p as hash, q as get, f as fn, u as concat, v as array, a as templateFactory } from './main-eDZ-Hi8y.js';

const V = 0,
  F = 1,
  _ = 2;
function z(e) {
  return !!e && e.length > 0;
}
function W(e, t) {
  if (null === e) return null;
  let r = [];
  for (let n of e) r.push(t(n));
  return r;
}
class $e extends te("Template").fields() {}
class Ge extends te("InElement").fields() {}
class Me extends te("Not").fields() {}
class De extends te("If").fields() {}
class Ve extends te("IfInline").fields() {}
class Fe extends te("Each").fields() {}
class _e extends te("Let").fields() {}
class je extends te("WithDynamicVars").fields() {}
class ze extends te("GetDynamicVar").fields() {}
class We extends te("Log").fields() {}
class qe extends te("InvokeComponent").fields() {}
class Ke extends te("NamedBlocks").fields() {}
class Re extends te("NamedBlock").fields() {}
class Ue extends te("AppendTrustedHTML").fields() {}
class Ye extends te("AppendTextNode").fields() {}
class Je extends te("AppendComment").fields() {}
class Xe extends te("Component").fields() {}
class Ze extends te("StaticAttr").fields() {}
class Qe extends te("DynamicAttr").fields() {}
class et extends te("SimpleElement").fields() {}
class tt extends te("ElementParameters").fields() {}
class rt extends te("Yield").fields() {}
class nt extends te("Debugger").fields() {}
class st extends te("CallExpression").fields() {}
class at extends te("Modifier").fields() {}
class it extends te("InvokeBlock").fields() {}
class lt extends te("SplatAttr").fields() {}
class ot extends te("PathExpression").fields() {}
class ct extends te("Missing").fields() {}
class ut extends te("InterpolateExpression").fields() {}
class pt extends te("HasBlock").fields() {}
class mt extends te("HasBlockParams").fields() {}
class dt extends te("Curry").fields() {}
class ht extends te("Positional").fields() {}
class ft extends te("NamedArguments").fields() {}
class yt extends te("NamedArgument").fields() {}
class kt extends te("Args").fields() {}
class gt extends te("Tail").fields() {}
class vt {
  constructor(e) {
    this.list = e;
  }
  toArray() {
    return this.list;
  }
  map(e) {
    let t = W(this.list, e);
    return new vt(t);
  }
  filter(e) {
    let t = [];
    for (let r of this.list) e(r) && t.push(r);
    return At(t);
  }
  toPresentArray() {
    return this.list;
  }
  into({
    ifPresent: e
  }) {
    return e(this);
  }
}
class wt {
  map(e) {
    return new wt();
  }
  filter(e) {
    return new wt();
  }
  toArray() {
    return this.list;
  }
  toPresentArray() {
    return null;
  }
  into({
    ifEmpty: e
  }) {
    return e();
  }
  constructor() {
    this.list = [];
  }
}
function At(e) {
  return z(e) ? new vt(e) : new wt();
}
class bt {
  static all(...e) {
    let t = [];
    for (let r of e) {
      if (r.isErr) return r.cast();
      t.push(r.value);
    }
    return Bt(t);
  }
}
const xt = bt;
class Et extends bt {
  constructor(e) {
    super(), this.value = e, this.isOk = true, this.isErr = false;
  }
  expect(e) {
    return this.value;
  }
  ifOk(e) {
    return e(this.value), this;
  }
  andThen(e) {
    return e(this.value);
  }
  mapOk(e) {
    return Bt(e(this.value));
  }
  ifErr(e) {
    return this;
  }
  mapErr(e) {
    return this;
  }
}
class Ct extends bt {
  constructor(e) {
    super(), this.reason = e, this.isOk = false, this.isErr = true;
  }
  expect(e) {
    throw new Error(e || "expected an Ok, got Err");
  }
  andThen(e) {
    return this.cast();
  }
  mapOk(e) {
    return this.cast();
  }
  ifOk(e) {
    return this;
  }
  mapErr(e) {
    return St(e(this.reason));
  }
  ifErr(e) {
    return e(this.reason), this;
  }
  cast() {
    return this;
  }
}
function Bt(e) {
  return new Et(e);
}
function St(e) {
  return new Ct(e);
}
class Ot {
  constructor(e = []) {
    this.items = e;
  }
  add(e) {
    this.items.push(e);
  }
  toArray() {
    let e = this.items.filter(e => e instanceof Ct)[0];
    return void 0 !== e ? e.cast() : Bt(this.items.map(e => e.value));
  }
  toOptionalList() {
    return this.toArray().mapOk(e => At(e));
  }
}
function Tt(e) {
  return "Path" === e.type && "Free" === e.ref.type && e.ref.name in P ? new Ie.CallExpression({
    callee: e,
    args: Ie.Args.empty(e.loc),
    loc: e.loc
  }) : e;
}
const Nt = new class {
  visit(e, t) {
    switch (e.type) {
      case "Literal":
        return Bt(this.Literal(e));
      case "Keyword":
        return Bt(this.Keyword(e));
      case "Interpolate":
        return this.Interpolate(e, t);
      case "Path":
        return this.PathExpression(e);
      case "Call":
        {
          let r = Zt.translate(e, t);
          return null !== r ? r : this.CallExpression(e, t);
        }
    }
  }
  visitList(e, t) {
    return new Ot(e.map(e => Nt.visit(e, t))).toOptionalList();
  }
  PathExpression(e) {
    let t = this.VariableReference(e.ref),
      {
        tail: r
      } = e;
    if (z(r)) {
      let s = r[0].loc.extend((n = r, 0 === n.length ? void 0 : n[n.length - 1]).loc);
      return Bt(new ot({
        loc: e.loc,
        head: t,
        tail: new gt({
          loc: s,
          members: r
        })
      }));
    }
    return Bt(t);
    var n;
  }
  VariableReference(e) {
    return e;
  }
  Literal(e) {
    return e;
  }
  Keyword(e) {
    return e;
  }
  Interpolate(e, t) {
    let r = e.parts.map(Tt);
    return Nt.visitList(r, t).mapOk(t => new ut({
      loc: e.loc,
      parts: t
    }));
  }
  CallExpression(e, t) {
    if ("Call" === e.callee.type) throw new Error("unimplemented: subexpression at the head of a subexpression");
    return xt.all(Nt.visit(e.callee, t), Nt.Args(e.args, t)).mapOk(([t, r]) => new st({
      loc: e.loc,
      callee: t,
      args: r
    }));
  }
  Args({
    positional: e,
    named: t,
    loc: r
  }, n) {
    return xt.all(this.Positional(e, n), this.NamedArguments(t, n)).mapOk(([e, t]) => new kt({
      loc: r,
      positional: e,
      named: t
    }));
  }
  Positional(e, t) {
    return Nt.visitList(e.exprs, t).mapOk(t => new ht({
      loc: e.loc,
      list: t
    }));
  }
  NamedArguments(e, t) {
    let r = e.entries.map(e => {
      let r = Tt(e.value);
      return Nt.visit(r, t).mapOk(t => new yt({
        loc: e.loc,
        key: e.name,
        value: t
      }));
    });
    return new Ot(r).toOptionalList().mapOk(t => new ft({
      loc: e.loc,
      entries: t
    }));
  }
}();
class It {
  constructor(e, t, r) {
    this.keyword = e, this.delegate = r;
    let n = new Set();
    for (let e of Pt[t]) n.add(e);
    this.types = n;
  }
  match(e) {
    if (!this.types.has(e.type)) return false;
    let t = Ht(e);
    return null !== t && "Path" === t.type && "Free" === t.ref.type && t.ref.name === this.keyword;
  }
  translate(e, t) {
    if (this.match(e)) {
      let r = Ht(e);
      return null !== r && "Path" === r.type && r.tail.length > 0 ? St(ot$1(`The \`${this.keyword}\` keyword was used incorrectly. It was used as \`${r.loc.asString()}\`, but it cannot be used with additional path segments. \n\nError caused by`, e.loc)) : this.delegate.assert(e, t).andThen(r => this.delegate.translate({
        node: e,
        state: t
      }, r));
    }
    return null;
  }
}
const Pt = {
  Call: ["Call"],
  Block: ["InvokeBlock"],
  Append: ["AppendContent"],
  Modifier: ["ElementModifier"]
};
function Ht(e) {
  switch (e.type) {
    case "Path":
      return e;
    case "AppendContent":
      return Ht(e.value);
    case "Call":
    case "InvokeBlock":
    case "ElementModifier":
      return e.callee;
    default:
      return null;
  }
}
class Lt {
  constructor(e) {
    this._keywords = [], this._type = e;
  }
  kw(e, t) {
    return this._keywords.push(new It(e, this._type, t)), this;
  }
  translate(e, t) {
    for (let r of this._keywords) {
      let n = r.translate(e, t);
      if (null !== n) return n;
    }
    let r = Ht(e);
    if (r && "Path" === r.type && "Free" === r.ref.type && x(r.ref.name)) {
      let {
          name: t
        } = r.ref,
        n = this._type,
        s = P[t];
      if (!s.includes(n)) return St(ot$1(`The \`${t}\` keyword was used incorrectly. It was used as ${$t[n]}, but its valid usages are:\n\n${function (e, t) {
        return t.map(t => {
          switch (t) {
            case "Append":
              return `- As an append statement, as in: {{${e}}}`;
            case "Block":
              return `- As a block statement, as in: {{#${e}}}{{/${e}}}`;
            case "Call":
              return `- As an expression, as in: (${e})`;
            case "Modifier":
              return `- As a modifier, as in: <div {{${e}}}></div>`;
            default:
              return;
          }
        }).join("\n\n");
      }(t, s)}\n\nError caused by`, e.loc));
    }
    return null;
  }
}
const $t = {
  Append: "an append statement",
  Block: "a block statement",
  Call: "a call expression",
  Modifier: "a modifier"
};
function Gt(e) {
  return new Lt(e);
}
function Mt({
  assert: e,
  translate: t
}) {
  return {
    assert: e,
    translate: ({
      node: e,
      state: r
    }, n) => t({
      node: e,
      state: r
    }, n).mapOk(t => new Ye({
      text: t,
      loc: e.loc
    }))
  };
}
const Dt = {
  [V]: "component",
  [F]: "helper",
  [_]: "modifier"
};
function Vt(e) {
  return (t, r) => {
    let n = Dt[e],
      s = 0 === e,
      {
        args: a
      } = t,
      i = a.nth(0);
    if (null === i) return St(ot$1(`(${n}) requires a ${n} definition or identifier as its first positional parameter, did not receive any parameters.`, a.loc));
    if ("Literal" === i.type) {
      if (s && r.isStrict) return St(ot$1(`(${n}) cannot resolve string values in strict mode templates`, t.loc));
      if (!s) return St(ot$1(`(${n}) cannot resolve string values, you must pass a ${n} definition directly`, t.loc));
    }
    return a = new Ie.Args({
      positional: new Ie.PositionalArguments({
        exprs: a.positional.exprs.slice(1),
        loc: a.positional.loc
      }),
      named: a.named,
      loc: a.loc
    }), Bt({
      definition: i,
      args: a
    });
  };
}
function Ft(e) {
  return ({
    node: t,
    state: r
  }, {
    definition: n,
    args: s
  }) => {
    let a = Nt.visit(n, r),
      i = Nt.Args(s, r);
    return xt.all(a, i).mapOk(([r, n]) => new dt({
      loc: t.loc,
      curriedType: e,
      definition: r,
      args: n
    }));
  };
}
function _t(e) {
  return {
    assert: Vt(e),
    translate: Ft(e)
  };
}
const jt = {
  assert: function (e) {
    let t = "AppendContent" === e.type ? e.value : e,
      r = "Call" === t.type ? t.args.named : null,
      n = "Call" === t.type ? t.args.positional : null;
    if (r && !r.isEmpty()) return St(ot$1("(-get-dynamic-vars) does not take any named arguments", e.loc));
    let s = n?.nth(0);
    return s ? n && n.size > 1 ? St(ot$1("(-get-dynamic-vars) only receives one positional arg", e.loc)) : Bt(s) : St(ot$1("(-get-dynamic-vars) requires a var name to get", e.loc));
  },
  translate: function ({
    node: e,
    state: t
  }, r) {
    return Nt.visit(r, t).mapOk(t => new ze({
      name: t,
      loc: e.loc
    }));
  }
};
function zt(e) {
  return t => {
    let r = "AppendContent" === t.type ? t.value : t,
      n = "Call" === r.type ? r.args.named : null,
      s = "Call" === r.type ? r.args.positional : null;
    if (n && !n.isEmpty()) return St(ot$1(`(${e}) does not take any named arguments`, r.loc));
    if (!s || s.isEmpty()) return Bt(j.synthetic("default"));
    if (1 === s.exprs.length) {
      let t = s.exprs[0];
      return Ie.isLiteral(t, "string") ? Bt(t.toSlice()) : St(ot$1(`(${e}) can only receive a string literal as its first argument`, r.loc));
    }
    return St(ot$1(`(${e}) only takes a single positional argument`, r.loc));
  };
}
function Wt(e) {
  return ({
    node: t,
    state: {
      scope: r
    }
  }, n) => Bt("has-block" === e ? new pt({
    loc: t.loc,
    target: n,
    symbol: r.allocateBlock(n.chars)
  }) : new mt({
    loc: t.loc,
    target: n,
    symbol: r.allocateBlock(n.chars)
  }));
}
function qt(e) {
  return {
    assert: zt(e),
    translate: Wt(e)
  };
}
function Kt(e) {
  return t => {
    let r = "unless" === e,
      n = "AppendContent" === t.type ? t.value : t,
      s = "Call" === n.type ? n.args.named : null,
      a = "Call" === n.type ? n.args.positional : null;
    if (s && !s.isEmpty()) return St(ot$1(`(${e}) cannot receive named parameters, received ${s.entries.map(e => e.name.chars).join(", ")}`, t.loc));
    let i = a?.nth(0);
    if (!a || !i) return St(ot$1(`When used inline, (${e}) requires at least two parameters 1. the condition that determines the state of the (${e}), and 2. the value to return if the condition is ${r ? "false" : "true"}. Did not receive any parameters`, t.loc));
    let l = a.nth(1),
      o = a.nth(2);
    return null === l ? St(ot$1(`When used inline, (${e}) requires at least two parameters 1. the condition that determines the state of the (${e}), and 2. the value to return if the condition is ${r ? "false" : "true"}. Received only one parameter, the condition`, t.loc)) : a.size > 3 ? St(ot$1(`When used inline, (${e}) can receive a maximum of three positional parameters 1. the condition that determines the state of the (${e}), 2. the value to return if the condition is ${r ? "false" : "true"}, and 3. the value to return if the condition is ${r ? "true" : "false"}. Received ${a.size} parameters`, t.loc)) : Bt({
      condition: i,
      truthy: l,
      falsy: o
    });
  };
}
function Rt(e) {
  let t = "unless" === e;
  return ({
    node: e,
    state: r
  }, {
    condition: n,
    truthy: s,
    falsy: a
  }) => {
    let i = Nt.visit(n, r),
      l = Nt.visit(s, r),
      o = a ? Nt.visit(a, r) : Bt(null);
    return xt.all(i, l, o).mapOk(([r, n, s]) => (t && (r = new Me({
      value: r,
      loc: e.loc
    })), new Ve({
      loc: e.loc,
      condition: r,
      truthy: n,
      falsy: s
    })));
  };
}
function Ut(e) {
  return {
    assert: Kt(e),
    translate: Rt(e)
  };
}
const Yt = {
    assert: function (e) {
      let {
        args: {
          named: t,
          positional: r
        }
      } = e;
      return t.isEmpty() ? Bt(r) : St(ot$1("(log) does not take any named arguments", e.loc));
    },
    translate: function ({
      node: e,
      state: t
    }, r) {
      return Nt.Positional(r, t).mapOk(t => new We({
        positional: t,
        loc: e.loc
      }));
    }
  },
  Jt = Gt("Append").kw("has-block", Mt(qt("has-block"))).kw("has-block-params", Mt(qt("has-block-params"))).kw("-get-dynamic-var", Mt(jt)).kw("log", Mt(Yt)).kw("if", Mt(Ut("if"))).kw("unless", Mt(Ut("unless"))).kw("yield", {
    assert(e) {
      let {
        args: t
      } = e;
      if (t.named.isEmpty()) return Bt({
        target: it$1.SourceSpan.synthetic("default").toSlice(),
        positional: t.positional
      });
      {
        let e = t.named.get("to");
        return t.named.size > 1 || null === e ? St(ot$1("yield only takes a single named argument: 'to'", t.named.loc)) : Ie.isLiteral(e, "string") ? Bt({
          target: e.toSlice(),
          positional: t.positional
        }) : St(ot$1("you can only yield to a literal string value", e.loc));
      }
    },
    translate: ({
      node: e,
      state: t
    }, {
      target: r,
      positional: n
    }) => Nt.Positional(n, t).mapOk(n => new rt({
      loc: e.loc,
      target: r,
      to: t.scope.allocateBlock(r.chars),
      positional: n
    }))
  }).kw("debugger", {
    assert(e) {
      let {
          args: t
        } = e,
        {
          positional: r
        } = t;
      return t.isEmpty() ? Bt(void 0) : r.isEmpty() ? St(ot$1("debugger does not take any named arguments", e.loc)) : St(ot$1("debugger does not take any positional arguments", e.loc));
    },
    translate: ({
      node: e,
      state: {
        scope: t
      }
    }) => Bt(new nt({
      loc: e.loc,
      scope: t
    }))
  }).kw("component", {
    assert: Vt(0),
    translate({
      node: e,
      state: t
    }, {
      definition: r,
      args: n
    }) {
      let s = Nt.visit(r, t),
        a = Nt.Args(n, t);
      return xt.all(s, a).mapOk(([t, r]) => new qe({
        loc: e.loc,
        definition: t,
        args: r,
        blocks: null
      }));
    }
  }).kw("helper", {
    assert: Vt(1),
    translate({
      node: e,
      state: t
    }, {
      definition: r,
      args: n
    }) {
      let s = Nt.visit(r, t),
        a = Nt.Args(n, t);
      return xt.all(s, a).mapOk(([t, r]) => {
        let n = new st({
          callee: t,
          args: r,
          loc: e.loc
        });
        return new Ye({
          loc: e.loc,
          text: n
        });
      });
    }
  }),
  Xt = Gt("Block").kw("in-element", {
    assert(e) {
      let {
          args: t
        } = e,
        r = t.get("guid");
      if (r) return St(ot$1("Cannot pass `guid` to `{{#in-element}}`", r.loc));
      let n = t.get("insertBefore"),
        s = t.nth(0);
      return null === s ? St(ot$1("{{#in-element}} requires a target element as its first positional parameter", t.loc)) : Bt({
        insertBefore: n,
        destination: s
      });
    },
    translate({
      node: e,
      state: t
    }, {
      insertBefore: r,
      destination: n
    }) {
      let s = e.blocks.get("default"),
        a = hr.NamedBlock(s, t),
        i = Nt.visit(n, t);
      return xt.all(a, i).andThen(([n, s]) => r ? Nt.visit(r, t).mapOk(e => ({
        body: n,
        destination: s,
        insertBefore: e
      })) : Bt({
        body: n,
        destination: s,
        insertBefore: new ct({
          loc: e.callee.loc.collapse("end")
        })
      })).mapOk(({
        body: r,
        destination: n,
        insertBefore: s
      }) => new Ge({
        loc: e.loc,
        block: r,
        insertBefore: s,
        guid: t.generateUniqueCursor(),
        destination: n
      }));
    }
  }).kw("if", {
    assert(e) {
      let {
        args: t
      } = e;
      if (!t.named.isEmpty()) return St(ot$1(`{{#if}} cannot receive named parameters, received ${t.named.entries.map(e => e.name.chars).join(", ")}`, e.loc));
      if (t.positional.size > 1) return St(ot$1(`{{#if}} can only receive one positional parameter in block form, the conditional value. Received ${t.positional.size} parameters`, e.loc));
      let r = t.nth(0);
      return null === r ? St(ot$1("{{#if}} requires a condition as its first positional parameter, did not receive any parameters", e.loc)) : Bt({
        condition: r
      });
    },
    translate({
      node: e,
      state: t
    }, {
      condition: r
    }) {
      let n = e.blocks.get("default"),
        s = e.blocks.get("else"),
        a = Nt.visit(r, t),
        i = hr.NamedBlock(n, t),
        l = s ? hr.NamedBlock(s, t) : Bt(null);
      return xt.all(a, i, l).mapOk(([t, r, n]) => new De({
        loc: e.loc,
        condition: t,
        block: r,
        inverse: n
      }));
    }
  }).kw("unless", {
    assert(e) {
      let {
        args: t
      } = e;
      if (!t.named.isEmpty()) return St(ot$1(`{{#unless}} cannot receive named parameters, received ${t.named.entries.map(e => e.name.chars).join(", ")}`, e.loc));
      if (t.positional.size > 1) return St(ot$1(`{{#unless}} can only receive one positional parameter in block form, the conditional value. Received ${t.positional.size} parameters`, e.loc));
      let r = t.nth(0);
      return null === r ? St(ot$1("{{#unless}} requires a condition as its first positional parameter, did not receive any parameters", e.loc)) : Bt({
        condition: r
      });
    },
    translate({
      node: e,
      state: t
    }, {
      condition: r
    }) {
      let n = e.blocks.get("default"),
        s = e.blocks.get("else"),
        a = Nt.visit(r, t),
        i = hr.NamedBlock(n, t),
        l = s ? hr.NamedBlock(s, t) : Bt(null);
      return xt.all(a, i, l).mapOk(([t, r, n]) => new De({
        loc: e.loc,
        condition: new Me({
          value: t,
          loc: e.loc
        }),
        block: r,
        inverse: n
      }));
    }
  }).kw("each", {
    assert(e) {
      let {
        args: t
      } = e;
      if (!t.named.entries.every(e => "key" === e.name.chars)) return St(ot$1(`{{#each}} can only receive the 'key' named parameter, received ${t.named.entries.filter(e => "key" !== e.name.chars).map(e => e.name.chars).join(", ")}`, t.named.loc));
      if (t.positional.size > 1) return St(ot$1(`{{#each}} can only receive one positional parameter, the collection being iterated. Received ${t.positional.size} parameters`, t.positional.loc));
      let r = t.nth(0),
        n = t.get("key");
      return null === r ? St(ot$1("{{#each}} requires an iterable value to be passed as its first positional parameter, did not receive any parameters", t.loc)) : Bt({
        value: r,
        key: n
      });
    },
    translate({
      node: e,
      state: t
    }, {
      value: r,
      key: n
    }) {
      let s = e.blocks.get("default"),
        a = e.blocks.get("else"),
        i = Nt.visit(r, t),
        l = n ? Nt.visit(n, t) : Bt(null),
        o = hr.NamedBlock(s, t),
        c = a ? hr.NamedBlock(a, t) : Bt(null);
      return xt.all(i, l, o, c).mapOk(([t, r, n, s]) => new Fe({
        loc: e.loc,
        value: t,
        key: r,
        block: n,
        inverse: s
      }));
    }
  }).kw("let", {
    assert(e) {
      let {
        args: t
      } = e;
      return t.named.isEmpty() ? 0 === t.positional.size ? St(ot$1("{{#let}} requires at least one value as its first positional parameter, did not receive any parameters", t.positional.loc)) : e.blocks.get("else") ? St(ot$1("{{#let}} cannot receive an {{else}} block", t.positional.loc)) : Bt({
        positional: t.positional
      }) : St(ot$1(`{{#let}} cannot receive named parameters, received ${t.named.entries.map(e => e.name.chars).join(", ")}`, t.named.loc));
    },
    translate({
      node: e,
      state: t
    }, {
      positional: r
    }) {
      let n = e.blocks.get("default"),
        s = Nt.Positional(r, t),
        a = hr.NamedBlock(n, t);
      return xt.all(s, a).mapOk(([t, r]) => new _e({
        loc: e.loc,
        positional: t,
        block: r
      }));
    }
  }).kw("-with-dynamic-vars", {
    assert: e => Bt({
      named: e.args.named
    }),
    translate({
      node: e,
      state: t
    }, {
      named: r
    }) {
      let n = e.blocks.get("default"),
        s = Nt.NamedArguments(r, t),
        a = hr.NamedBlock(n, t);
      return xt.all(s, a).mapOk(([t, r]) => new je({
        loc: e.loc,
        named: t,
        block: r
      }));
    }
  }).kw("component", {
    assert: Vt(0),
    translate({
      node: e,
      state: t
    }, {
      definition: r,
      args: n
    }) {
      let s = Nt.visit(r, t),
        a = Nt.Args(n, t),
        i = hr.NamedBlocks(e.blocks, t);
      return xt.all(s, a, i).mapOk(([t, r, n]) => new qe({
        loc: e.loc,
        definition: t,
        args: r,
        blocks: n
      }));
    }
  }),
  Zt = Gt("Call").kw("has-block", qt("has-block")).kw("has-block-params", qt("has-block-params")).kw("-get-dynamic-var", jt).kw("log", Yt).kw("if", Ut("if")).kw("unless", Ut("unless")).kw("component", _t(0)).kw("helper", _t(1)).kw("modifier", _t(2)),
  Qt = Gt("Modifier"),
  er = "http://www.w3.org/1999/xlink",
  tr = "http://www.w3.org/XML/1998/namespace",
  rr = "http://www.w3.org/2000/xmlns/",
  nr = {
    "xlink:actuate": er,
    "xlink:arcrole": er,
    "xlink:href": er,
    "xlink:role": er,
    "xlink:show": er,
    "xlink:title": er,
    "xlink:type": er,
    "xml:base": tr,
    "xml:lang": tr,
    "xml:space": tr,
    xmlns: rr,
    "xmlns:xlink": rr
  },
  sr = {
    div: r.div,
    span: r.span,
    p: r.p,
    a: r.a
  };
const lr = {
    class: n.class,
    id: n.id,
    value: n.value,
    name: n.name,
    type: n.type,
    style: n.style,
    href: n.href
  };
function cr(e) {
  return lr[e] ?? e;
}
class pr {
  constructor(e, t, r) {
    this.element = e, this.state = r, this.delegate = t;
  }
  toStatement() {
    return this.prepare().andThen(e => this.delegate.toStatement(this, e));
  }
  attr(e) {
    let t = e.name,
      r = e.value,
      n = (s = t.chars, nr[s] || void 0);
    var s;
    return Ie.isLiteral(r, "string") ? Bt(new Ze({
      loc: e.loc,
      name: t,
      value: r.toSlice(),
      namespace: n,
      kind: {
        component: this.delegate.dynamicFeatures
      }
    })) : Nt.visit(Tt(r), this.state).mapOk(r => {
      let s = e.trusting;
      return new Qe({
        loc: e.loc,
        name: t,
        value: r,
        namespace: n,
        kind: {
          trusting: s,
          component: this.delegate.dynamicFeatures
        }
      });
    });
  }
  modifier(e) {
    let t = Qt.translate(e, this.state);
    if (null !== t) return t;
    let r = Nt.visit(e.callee, this.state),
      n = Nt.Args(e.args, this.state);
    return xt.all(r, n).mapOk(([t, r]) => new at({
      loc: e.loc,
      callee: t,
      args: r
    }));
  }
  attrs() {
    let e = new Ot(),
      t = new Ot(),
      r = null,
      n = 0 === this.element.attrs.filter(e => "SplatAttr" === e.type).length;
    for (let t of this.element.attrs) "SplatAttr" === t.type ? e.add(Bt(new lt({
      loc: t.loc,
      symbol: this.state.scope.allocateBlock("attrs")
    }))) : "type" === t.name.chars && n ? r = t : e.add(this.attr(t));
    for (let e of this.element.componentArgs) t.add(this.delegate.arg(e, this));
    return r && e.add(this.attr(r)), xt.all(t.toArray(), e.toArray()).mapOk(([e, t]) => ({
      attrs: t,
      args: new ft({
        loc: at$1(e, it$1.SourceSpan.NON_EXISTENT),
        entries: At(e)
      })
    }));
  }
  prepare() {
    let e = this.attrs(),
      t = new Ot(this.element.modifiers.map(e => this.modifier(e))).toArray();
    return xt.all(e, t).mapOk(([e, t]) => {
      let {
          attrs: r,
          args: n
        } = e,
        s = [...r, ...t];
      return {
        args: n,
        params: new tt({
          loc: at$1(s, it$1.SourceSpan.NON_EXISTENT),
          body: At(s)
        })
      };
    });
  }
}
class mr {
  constructor(e, t) {
    this.tag = e, this.element = t, this.dynamicFeatures = true;
  }
  arg(e, {
    state: t
  }) {
    let r = e.name;
    return Nt.visit(Tt(e.value), t).mapOk(t => new yt({
      loc: e.loc,
      key: r,
      value: t
    }));
  }
  toStatement(e, {
    args: t,
    params: r
  }) {
    let {
      element: n,
      state: s
    } = e;
    return this.blocks(s).mapOk(e => new Xe({
      loc: n.loc,
      tag: this.tag,
      params: r,
      args: t,
      blocks: e
    }));
  }
  blocks(e) {
    return hr.NamedBlocks(this.element.blocks, e);
  }
}
class dr {
  constructor(e, t, r) {
    this.tag = e, this.element = t, this.dynamicFeatures = r, this.isComponent = false;
  }
  arg(e) {
    return St(ot$1(`${e.name.chars} is not a valid attribute name. @arguments are only allowed on components, but the tag for this element (\`${this.tag.chars}\`) is a regular, non-component HTML element.`, e.loc));
  }
  toStatement(e, {
    params: t
  }) {
    let {
      state: r,
      element: n
    } = e;
    return hr.visitList(this.element.body, r).mapOk(e => new et({
      loc: n.loc,
      tag: this.tag,
      params: t,
      body: e.toArray(),
      dynamicFeatures: this.dynamicFeatures
    }));
  }
}
const hr = new class {
  visitList(e, t) {
    return new Ot(e.map(e => hr.visit(e, t))).toOptionalList().mapOk(e => e.filter(e => null !== e));
  }
  visit(e, t) {
    switch (e.type) {
      case "GlimmerComment":
        return Bt(null);
      case "AppendContent":
        return this.AppendContent(e, t);
      case "HtmlText":
        return Bt(this.TextNode(e));
      case "HtmlComment":
        return Bt(this.HtmlComment(e));
      case "InvokeBlock":
        return this.InvokeBlock(e, t);
      case "InvokeComponent":
        return this.Component(e, t);
      case "SimpleElement":
        return this.SimpleElement(e, t);
    }
  }
  InvokeBlock(e, t) {
    let r = Xt.translate(e, t);
    if (null !== r) return r;
    let n = Nt.visit(e.callee, t),
      s = Nt.Args(e.args, t);
    return xt.all(n, s).andThen(([r, n]) => this.NamedBlocks(e.blocks, t).mapOk(t => new it({
      loc: e.loc,
      head: r,
      args: n,
      blocks: t
    })));
  }
  NamedBlocks(e, t) {
    return new Ot(e.blocks.map(e => this.NamedBlock(e, t))).toArray().mapOk(t => new Ke({
      loc: e.loc,
      blocks: At(t)
    }));
  }
  NamedBlock(e, t) {
    return t.visitBlock(e.block).mapOk(t => new Re({
      loc: e.loc,
      name: e.name,
      body: t.toArray(),
      scope: e.block.scope
    }));
  }
  SimpleElement(e, t) {
    return new pr(e, new dr(e.tag, e, function ({
      attrs: e,
      modifiers: t
    }) {
      return t.length > 0 || !!e.filter(e => "SplatAttr" === e.type)[0];
    }(e)), t).toStatement();
  }
  Component(e, t) {
    return Nt.visit(e.callee, t).andThen(r => new pr(e, new mr(r, e), t).toStatement());
  }
  AppendContent(e, t) {
    let r = Jt.translate(e, t);
    return null !== r ? r : Nt.visit(e.value, t).mapOk(t => e.trusting ? new Ue({
      loc: e.loc,
      html: t
    }) : new Ye({
      loc: e.loc,
      text: t
    }));
  }
  TextNode(e) {
    return new Ye({
      loc: e.loc,
      text: new Ie.LiteralExpression({
        loc: e.loc,
        value: e.chars
      })
    });
  }
  HtmlComment(e) {
    return new Je({
      loc: e.loc,
      value: e.text
    });
  }
}();
class fr {
  constructor(e, t) {
    this.isStrict = t, this._cursorCount = 0, this._currentScope = e;
  }
  generateUniqueCursor() {
    return `%cursor:${this._cursorCount++}%`;
  }
  get scope() {
    return this._currentScope;
  }
  visitBlock(e) {
    let t = this._currentScope;
    this._currentScope = e.scope;
    try {
      return hr.visitList(e.body, this);
    } finally {
      this._currentScope = t;
    }
  }
}
const yr = "component",
  kr = "helper",
  gr = "modifier";
class vr {
  static validate(e) {
    return new this(e).validate();
  }
  constructor(e) {
    this.template = e;
  }
  validate() {
    return this.Statements(this.template.body).mapOk(() => this.template);
  }
  Statements(e) {
    let t = Bt(null);
    for (let r of e) t = t.andThen(() => this.Statement(r));
    return t;
  }
  NamedBlocks({
    blocks: e
  }) {
    let t = Bt(null);
    for (let r of e.toArray()) t = t.andThen(() => this.NamedBlock(r));
    return t;
  }
  NamedBlock(e) {
    return this.Statements(e.body);
  }
  Statement(e) {
    switch (e.type) {
      case "InElement":
        return this.InElement(e);
      case "Debugger":
      case "AppendComment":
        return Bt(null);
      case "Yield":
        return this.Yield(e);
      case "AppendTrustedHTML":
        return this.AppendTrustedHTML(e);
      case "AppendTextNode":
        return this.AppendTextNode(e);
      case "Component":
        return this.Component(e);
      case "SimpleElement":
        return this.SimpleElement(e);
      case "InvokeBlock":
        return this.InvokeBlock(e);
      case "If":
        return this.If(e);
      case "Each":
        return this.Each(e);
      case "Let":
        return this.Let(e);
      case "WithDynamicVars":
        return this.WithDynamicVars(e);
      case "InvokeComponent":
        return this.InvokeComponent(e);
    }
  }
  Expressions(e) {
    let t = Bt(null);
    for (let r of e) t = t.andThen(() => this.Expression(r));
    return t;
  }
  Expression(e, t = e, r) {
    switch (e.type) {
      case "Literal":
      case "Keyword":
      case "Missing":
      case "This":
      case "Arg":
      case "Local":
      case "HasBlock":
      case "HasBlockParams":
      case "GetDynamicVar":
        return Bt(null);
      case "PathExpression":
        return this.Expression(e.head, t, r);
      case "Free":
        return this.errorFor(e.name, t, r);
      case "InterpolateExpression":
        return this.InterpolateExpression(e, t, r);
      case "CallExpression":
        return this.CallExpression(e, t, r ?? kr);
      case "Not":
        return this.Expression(e.value, t, r);
      case "IfInline":
        return this.IfInline(e);
      case "Curry":
        return this.Curry(e);
      case "Log":
        return this.Log(e);
    }
  }
  Args(e) {
    return this.Positional(e.positional).andThen(() => this.NamedArguments(e.named));
  }
  Positional(e, t) {
    let r = Bt(null),
      n = e.list.toArray();
    return r = 1 === n.length ? this.Expression(n[0], t) : this.Expressions(n), r;
  }
  NamedArguments({
    entries: e
  }) {
    let t = Bt(null);
    for (let r of e.toArray()) t = t.andThen(() => this.NamedArgument(r));
    return t;
  }
  NamedArgument(e) {
    return "CallExpression" === e.value.type ? this.Expression(e.value, e, kr) : this.Expression(e.value, e);
  }
  ElementParameters({
    body: e
  }) {
    let t = Bt(null);
    for (let r of e.toArray()) t = t.andThen(() => this.ElementParameter(r));
    return t;
  }
  ElementParameter(e) {
    switch (e.type) {
      case "StaticAttr":
      case "SplatAttr":
        return Bt(null);
      case "DynamicAttr":
        return this.DynamicAttr(e);
      case "Modifier":
        return this.Modifier(e);
    }
  }
  DynamicAttr(e) {
    return "CallExpression" === e.value.type ? this.Expression(e.value, e, kr) : this.Expression(e.value, e);
  }
  Modifier(e) {
    return this.Expression(e.callee, e, gr).andThen(() => this.Args(e.args));
  }
  InElement(e) {
    return this.Expression(e.destination).andThen(() => this.Expression(e.insertBefore)).andThen(() => this.NamedBlock(e.block));
  }
  Yield(e) {
    return this.Positional(e.positional, e);
  }
  AppendTrustedHTML(e) {
    return this.Expression(e.html, e);
  }
  AppendTextNode(e) {
    return "CallExpression" === e.text.type ? this.Expression(e.text, e, "component or helper") : this.Expression(e.text, e);
  }
  Component(e) {
    return this.Expression(e.tag, e, yr).andThen(() => this.ElementParameters(e.params)).andThen(() => this.NamedArguments(e.args)).andThen(() => this.NamedBlocks(e.blocks));
  }
  SimpleElement(e) {
    return this.ElementParameters(e.params).andThen(() => this.Statements(e.body));
  }
  InvokeBlock(e) {
    return this.Expression(e.head, e.head, yr).andThen(() => this.Args(e.args)).andThen(() => this.NamedBlocks(e.blocks));
  }
  If(e) {
    return this.Expression(e.condition, e).andThen(() => this.NamedBlock(e.block)).andThen(() => e.inverse ? this.NamedBlock(e.inverse) : Bt(null));
  }
  Each(e) {
    return this.Expression(e.value, e).andThen(() => e.key ? this.Expression(e.key, e) : Bt(null)).andThen(() => this.NamedBlock(e.block)).andThen(() => e.inverse ? this.NamedBlock(e.inverse) : Bt(null));
  }
  Let(e) {
    return this.Positional(e.positional).andThen(() => this.NamedBlock(e.block));
  }
  WithDynamicVars(e) {
    return this.NamedArguments(e.named).andThen(() => this.NamedBlock(e.block));
  }
  InvokeComponent(e) {
    return this.Expression(e.definition, e, yr).andThen(() => this.Args(e.args)).andThen(() => e.blocks ? this.NamedBlocks(e.blocks) : Bt(null));
  }
  InterpolateExpression(e, t, r) {
    let n = e.parts.toArray();
    return 1 === n.length ? this.Expression(n[0], t, r) : this.Expressions(n);
  }
  CallExpression(e, t, r) {
    return this.Expression(e.callee, t, r).andThen(() => this.Args(e.args));
  }
  IfInline(e) {
    return this.Expression(e.condition).andThen(() => this.Expression(e.truthy)).andThen(() => e.falsy ? this.Expression(e.falsy) : Bt(null));
  }
  Curry(e) {
    let t;
    return t = 0 === e.curriedType ? yr : 1 === e.curriedType ? kr : gr, this.Expression(e.definition, e, t).andThen(() => this.Args(e.args));
  }
  Log(e) {
    return this.Positional(e.positional, e);
  }
  errorFor(e, t, r = "value") {
    return St(ot$1(`Attempted to resolve a ${r} in a strict mode template, but that value was not in scope: ${e}`, rt$1(t)));
  }
}
const Ar = new class {
  expr(e) {
    switch (e.type) {
      case "Missing":
        return;
      case "Literal":
        return this.Literal(e);
      case "Keyword":
        return this.Keyword(e);
      case "CallExpression":
        return this.CallExpression(e);
      case "PathExpression":
        return this.PathExpression(e);
      case "Arg":
        return [t.GetSymbol, e.symbol];
      case "Local":
        return this.Local(e);
      case "This":
        return [t.GetSymbol, 0];
      case "Free":
        return [e.resolution.resolution(), e.symbol];
      case "HasBlock":
        return this.HasBlock(e);
      case "HasBlockParams":
        return this.HasBlockParams(e);
      case "Curry":
        return this.Curry(e);
      case "Not":
        return this.Not(e);
      case "IfInline":
        return this.IfInline(e);
      case "InterpolateExpression":
        return this.InterpolateExpression(e);
      case "GetDynamicVar":
        return this.GetDynamicVar(e);
      case "Log":
        return this.Log(e);
    }
  }
  Literal({
    value: e
  }) {
    return void 0 === e ? [t.Undefined] : e;
  }
  Missing() {}
  HasBlock({
    symbol: e
  }) {
    return [t.HasBlock, [t.GetSymbol, e]];
  }
  HasBlockParams({
    symbol: e
  }) {
    return [t.HasBlockParams, [t.GetSymbol, e]];
  }
  Curry({
    definition: e,
    curriedType: t$1,
    args: r
  }) {
    return [t.Curry, Ar.expr(e), t$1, Ar.Positional(r.positional), Ar.NamedArguments(r.named)];
  }
  Local({
    isTemplateLocal: e,
    symbol: t$1
  }) {
    return [e ? t.GetLexicalSymbol : t.GetSymbol, t$1];
  }
  Keyword({
    symbol: e
  }) {
    return [t.GetStrictKeyword, e];
  }
  PathExpression({
    head: e,
    tail: t$1
  }) {
    let r = Ar.expr(e);
    return r[0], [...r, Ar.Tail(t$1)];
  }
  InterpolateExpression({
    parts: e
  }) {
    return [t.Concat, e.map(e => Ar.expr(e)).toArray()];
  }
  CallExpression({
    callee: e,
    args: t$1
  }) {
    return [t.Call, Ar.expr(e), ...Ar.Args(t$1)];
  }
  Tail({
    members: e
  }) {
    return W(e, e => e.chars);
  }
  Args({
    positional: e,
    named: t
  }) {
    return [this.Positional(e), this.NamedArguments(t)];
  }
  Positional({
    list: e
  }) {
    return e.map(e => Ar.expr(e)).toPresentArray();
  }
  NamedArgument({
    key: e,
    value: t
  }) {
    return [e.chars, Ar.expr(t)];
  }
  NamedArguments({
    entries: e
  }) {
    let t = e.toArray();
    if (z(t)) {
      let e = [],
        r = [];
      for (let n of t) {
        let [t, s] = Ar.NamedArgument(n);
        e.push(t), r.push(s);
      }
      return [e, r];
    }
    return null;
  }
  Not({
    value: e
  }) {
    return [t.Not, Ar.expr(e)];
  }
  IfInline({
    condition: e,
    truthy: t$1,
    falsy: r
  }) {
    let n = [t.IfInline, Ar.expr(e), Ar.expr(t$1)];
    return r && n.push(Ar.expr(r)), n;
  }
  GetDynamicVar({
    name: e
  }) {
    return [t.GetDynamicVar, Ar.expr(e)];
  }
  Log({
    positional: e
  }) {
    return [t.Log, this.Positional(e)];
  }
}();
class br {
  constructor(e) {
    this.statements = e;
  }
  toArray() {
    return this.statements;
  }
}
const xr = new class {
  list(e) {
    let t = [];
    for (let r of e) {
      let e = xr.content(r);
      e instanceof br ? t.push(...e.toArray()) : t.push(e);
    }
    return t;
  }
  content(e) {
    return this.visitContent(e);
  }
  visitContent(e) {
    switch (e.type) {
      case "Debugger":
        return [t.Debugger, ...e.scope.getDebugInfo(), {}];
      case "AppendComment":
        return this.AppendComment(e);
      case "AppendTextNode":
        return this.AppendTextNode(e);
      case "AppendTrustedHTML":
        return this.AppendTrustedHTML(e);
      case "Yield":
        return this.Yield(e);
      case "Component":
        return this.Component(e);
      case "SimpleElement":
        return this.SimpleElement(e);
      case "InElement":
        return this.InElement(e);
      case "InvokeBlock":
        return this.InvokeBlock(e);
      case "If":
        return this.If(e);
      case "Each":
        return this.Each(e);
      case "Let":
        return this.Let(e);
      case "WithDynamicVars":
        return this.WithDynamicVars(e);
      case "InvokeComponent":
        return this.InvokeComponent(e);
      default:
        return;
    }
  }
  Yield({
    to: e,
    positional: t$1
  }) {
    return [t.Yield, e, Ar.Positional(t$1)];
  }
  InElement({
    guid: e,
    insertBefore: t$1,
    destination: r,
    block: n
  }) {
    let a = xr.NamedBlock(n)[1],
      i = Ar.expr(r),
      l = Ar.expr(t$1);
    return void 0 === l ? [t.InElement, a, e, i] : [t.InElement, a, e, i, l];
  }
  InvokeBlock({
    head: e,
    args: t$1,
    blocks: r
  }) {
    return [t.Block, Ar.expr(e), ...Ar.Args(t$1), xr.NamedBlocks(r)];
  }
  AppendTrustedHTML({
    html: e
  }) {
    return [t.TrustingAppend, Ar.expr(e)];
  }
  AppendTextNode({
    text: e
  }) {
    return [t.Append, Ar.expr(e)];
  }
  AppendComment({
    value: e
  }) {
    return [t.Comment, e.chars];
  }
  SimpleElement({
    tag: e,
    params: t$1,
    body: r,
    dynamicFeatures: n
  }) {
    let a = n ? t.OpenElementWithSplat : t.OpenElement;
    return new br([[a, (i = e.chars, sr[i] ?? i)], ...xr.ElementParameters(t$1).toArray(), [t.FlushElement], ...xr.list(r), [t.CloseElement]]);
    var i;
  }
  Component({
    tag: e,
    params: t$1,
    args: r,
    blocks: n
  }) {
    let a = Ar.expr(e),
      i = xr.ElementParameters(t$1),
      l = Ar.NamedArguments(r),
      o = xr.NamedBlocks(n);
    return [t.Component, a, i.toPresentArray(), l, o];
  }
  ElementParameters({
    body: e
  }) {
    return e.map(e => xr.ElementParameter(e));
  }
  ElementParameter(e) {
    switch (e.type) {
      case "SplatAttr":
        return [t.AttrSplat, e.symbol];
      case "DynamicAttr":
        return [(t$1 = e.kind, t$1.component ? t$1.trusting ? t.TrustingComponentAttr : t.ComponentAttr : t$1.trusting ? t.TrustingDynamicAttr : t.DynamicAttr), ...Cr(e)];
      case "StaticAttr":
        return [Br(e.kind), ...Er(e)];
      case "Modifier":
        return [t.Modifier, Ar.expr(e.callee), ...Ar.Args(e.args)];
    }
    var t$1;
  }
  NamedBlocks({
    blocks: e
  }) {
    let t = [],
      r = [];
    for (let n of e.toArray()) {
      let [e, s] = xr.NamedBlock(n);
      t.push(e), r.push(s);
    }
    return t.length > 0 ? [t, r] : null;
  }
  NamedBlock({
    name: e,
    body: t,
    scope: r
  }) {
    let n = e.chars;
    return "inverse" === n && (n = "else"), [n, [xr.list(t), r.slots]];
  }
  If({
    condition: e,
    block: t$1,
    inverse: r
  }) {
    return [t.If, Ar.expr(e), xr.NamedBlock(t$1)[1], r ? xr.NamedBlock(r)[1] : null];
  }
  Each({
    value: e,
    key: t$1,
    block: r,
    inverse: n
  }) {
    return [t.Each, Ar.expr(e), t$1 ? Ar.expr(t$1) : null, xr.NamedBlock(r)[1], n ? xr.NamedBlock(n)[1] : null];
  }
  Let({
    positional: e,
    block: t$1
  }) {
    return [t.Let, Ar.Positional(e), xr.NamedBlock(t$1)[1]];
  }
  WithDynamicVars({
    named: e,
    block: t$1
  }) {
    return [t.WithDynamicVars, Ar.NamedArguments(e), xr.NamedBlock(t$1)[1]];
  }
  InvokeComponent({
    definition: e,
    args: t$1,
    blocks: r
  }) {
    return [t.InvokeComponent, Ar.expr(e), Ar.Positional(t$1.positional), Ar.NamedArguments(t$1.named), r ? xr.NamedBlocks(r) : null];
  }
}();
function Er({
  name: e,
  value: t,
  namespace: r
}) {
  let n = [cr(e.chars), t.chars];
  return r && n.push(r), n;
}
function Cr({
  name: e,
  value: t,
  namespace: r
}) {
  let n = [cr(e.chars), Ar.expr(t)];
  return r && n.push(r), n;
}
function Br(e) {
  return e.component ? t.StaticComponentAttr : t.StaticAttr;
}
const Sr = (() => {
    const e = "object" == typeof module && "function" == typeof module.require ? module.require : globalThis.require;
    if (e) try {
      const t = e("crypto"),
        r = e => {
          const r = t.createHash("sha1");
          return r.update(e, "utf8"), r.digest("base64").substring(0, 8);
        };
      return r("test"), r;
    } catch {}
    return function () {
      return null;
    };
  })(),
  Or = {
    id: Sr
  };
function Tr(e, t = Or) {
  const r = new it$1.Source(e ?? "", t.meta?.moduleName),
    [n, s] = Xe$1(r, {
      lexicalScope: () => false,
      ...t
    }),
    a = function (e, t, r) {
      let n = new fr(t.table, r),
        s = hr.visitList(t.body, n).mapOk(e => new $e({
          loc: t.loc,
          scope: t.table,
          body: e.toArray()
        }));
      return r && (s = s.andThen(e => vr.validate(e))), s;
    }(0, n, t.strictMode ?? false).mapOk(e => function (e) {
      let t = xr.list(e.body),
        r = e.scope;
      return [t, r.symbols, r.upvars];
    }(e));
  if (a.isOk) return [a.value, s];
  throw a.reason;
}

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
  const locals = Zt$1(source);
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
