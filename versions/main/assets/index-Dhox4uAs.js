import { d as opcodes, W as WellKnownTagNames, e as WellKnownAttrNames, j as dict, k as assertNever, l as values, m as resolution } from './main-CjWhnG7r.js';
import { i as it$1, X as Xe$1, I as Ie$1, t as te$1, o as ot$1, r as rt$1, a as at$1, x as x$1, P as P$1, j as j$1 } from './index-BSZFMcPe.js';

const k = "Block",
  g = "Call",
  v = "Element",
  w = "AppendPath",
  A = "AppendExpr",
  b = "Literal",
  x = "Modifier",
  E = "DynamicComponent",
  C = "Comment",
  B = "Splat",
  S = "Keyword",
  O = "Local",
  T = "Free",
  N = "Block",
  I = "This",
  P = "Literal",
  H = "Call",
  L = "GetPath",
  $ = "GetVar",
  G = "Concat",
  M = "HasBlock",
  D = "HasBlockParams",
  V = 0,
  F = 1,
  _ = 2,
  j = "http://www.w3.org/2000/xmlns/";
function z(e) {
  return !!e && e.length > 0;
}
function W(e, t) {
  if (null === e) return null;
  let r = [];
  for (let n of e) r.push(t(n));
  return r;
}
function q(r) {
  return Array.isArray(r) ? function (e) {
    if (!Array.isArray(e)) return false;
    const t = e[0];
    if ("number" == typeof t) switch (t) {
      case 0:
      case 5:
      case 6:
      case 7:
      case 8:
        return true;
      default:
        return false;
    }
    return "(" === t[0];
  }(r) ? ae(r) : function (e) {
    if (Array.isArray(e) && "string" == typeof e[0]) switch (e[0][0]) {
      case "(":
      case "#":
      case "<":
      case "!":
        return true;
      default:
        return false;
    }
    return false;
  }(r) ? function (e) {
    const r = e[0];
    switch (r[0]) {
      case "(":
        {
          let t = null,
            n = null;
          return 3 === e.length ? (t = oe(e[1]), n = ce(e[2])) : 2 === e.length && (Array.isArray(e[1]) ? t = oe(e[1]) : n = ce(e[1])), {
            kind: g,
            head: U(r),
            params: t,
            hash: n,
            trusted: false
          };
        }
      case "#":
        {
          const {
            head: t,
            params: r,
            hash: n,
            blocks: s,
            blockParams: a
          } = Z(e);
          return {
            kind: k,
            head: t,
            params: r,
            hash: n,
            blocks: s,
            blockParams: a
          };
        }
      case "!":
        {
          const t = e[0].slice(1),
            {
              params: r,
              hash: n,
              blocks: s,
              blockParams: a
            } = Z(e);
          return {
            kind: S,
            name: t,
            params: r,
            hash: n,
            blocks: s,
            blockParams: a
          };
        }
      case "<":
        {
          let n = dict(),
            s = [];
          return 3 === e.length ? (n = re(e[1]), s = te(e[2])) : 2 === e.length && (Array.isArray(e[1]) ? s = te(e[1]) : n = re(e[1])), {
            kind: v,
            name: se(r),
            attrs: n,
            block: s
          };
        }
      default:
        throw new Error(`Unreachable ${JSON.stringify(e)} in normalizeSugaryArrayStatement`);
    }
  }(r) : function (e) {
    switch (e[0]) {
      case 0:
        return {
          kind: b,
          value: e[1]
        };
      case 2:
        return ae(e[1], e[2]);
      case 3:
        return {
          kind: x,
          params: oe(e[1]),
          hash: ce(e[2])
        };
      case 4:
        return {
          kind: E,
          expr: ie(e[1]),
          hash: ce(e[2]),
          block: te(e[3])
        };
      case 1:
        return {
          kind: C,
          value: e[1]
        };
    }
  }(r) : "string" == typeof r ? K(J(r), false) : void assertNever(r);
}
function K(e, t) {
  return e.type === L ? {
    kind: w,
    path: e,
    trusted: t
  } : {
    kind: A,
    expr: e,
    trusted: t
  };
}
function R(e) {
  const t = /^(#|!)(.*)$/u.exec(e);
  if (null === t) throw new Error("Unexpected missing # in block head");
  return J(t[2]);
}
function U(e) {
  const t = /^\((.*)\)$/u.exec(e);
  if (null === t) throw new Error("Unexpected missing () in call head");
  return J(t[1]);
}
function Y(e, t = []) {
  const r = X(e);
  return z(t) ? {
    type: L,
    path: {
      head: r,
      tail: t
    }
  } : {
    type: $,
    variable: r
  };
}
function J(e) {
  const {
      kind: t,
      name: r
    } = X(e),
    [n, ...s] = r.split("."),
    a = {
      kind: t,
      name: n,
      mode: "loose"
    };
  return z(s) ? {
    type: L,
    path: {
      head: a,
      tail: s
    }
  } : {
    type: $,
    variable: a
  };
}
function X(e) {
  let t, r;
  if (/^this(?:\.|$)/u.test(e)) return {
    kind: I,
    name: e,
    mode: "loose"
  };
  switch (e[0]) {
    case "^":
      t = T, r = e.slice(1);
      break;
    case "@":
      t = "Arg", r = e.slice(1);
      break;
    case "&":
      t = N, r = e.slice(1);
      break;
    default:
      t = O, r = e;
  }
  return {
    kind: t,
    name: r,
    mode: "loose"
  };
}
function Z(e) {
  const r = e[0];
  let n = dict(),
    s = null,
    a = null,
    i = null;
  return 2 === e.length ? n = ee(e[1]) : 3 === e.length ? (Array.isArray(e[1]) ? s = oe(e[1]) : {
    hash: a,
    blockParams: i
  } = Q(e[1]), n = ee(e[2])) : (s = oe(e[1]), {
    hash: a,
    blockParams: i
  } = Q(e[2]), n = ee(e[3])), {
    head: R(r),
    params: s,
    hash: a,
    blockParams: i,
    blocks: n
  };
}
function Q(e) {
  if (null === e) return {
    hash: null,
    blockParams: null
  };
  let r = null,
    n = null;
  return function (e, t) {
    Object.keys(e).forEach(r => {
      const n = e[r];
      t(r, n);
    });
  }(e, (e, s) => {
    "as" === e ? n = Array.isArray(s) ? s : [s] : (r = r || dict(), r[e] = ie(s));
  }), {
    hash: r,
    blockParams: n
  };
}
function ee(e) {
  return Array.isArray(e) ? {
    default: te(e)
  } : ne(e, te);
}
function te(e) {
  return e.map(e => q(e));
}
function re(e) {
  return ne(e, e => {
    return (t = e, "splat" === t ? {
      expr: B,
      trusted: false
    } : {
      expr: ie(t)}).expr;
    var t;
  });
}
function ne(e, r) {
  const n = dict();
  return Object.keys(e).forEach(t => {
    n[t] = r(e[t], t);
  }), n;
}
function se(e) {
  const t = /^<([\d\-a-z][\d\-A-Za-z]*)>$/u.exec(e);
  return t?.[1] ?? null;
}
function ae(t, r = false) {
  if (null == t) return {
    expr: {
      type: P,
      value: t
    },
    kind: A,
    trusted: false
  };
  if (Array.isArray(t)) switch (t[0]) {
    case 0:
      return {
        expr: {
          type: P,
          value: t[1]
        },
        kind: A,
        trusted: false
      };
    case 5:
      return K(Y(t[1], t[2]), r);
    case 6:
      return {
        expr: {
          type: G,
          params: oe(t.slice(1))
        },
        kind: A,
        trusted: r
      };
    case 7:
      return {
        expr: {
          type: M,
          name: t[1]
        },
        kind: A,
        trusted: r
      };
    case 8:
      return {
        expr: {
          type: D,
          name: t[1]
        },
        kind: A,
        trusted: r
      };
    default:
      if (le(t)) return {
        expr: ue(t),
        kind: A,
        trusted: r
      };
      throw new Error(`Unexpected array in expression position (wasn't a tuple expression and ${t[0]} isn't wrapped in parens, so it isn't a call): ${JSON.stringify(t)}`);
  } else if ("object" != typeof t) switch (typeof t) {
    case "string":
      return K(J(t), r);
    case "boolean":
    case "number":
      return {
        expr: {
          type: P,
          value: t
        },
        kind: A,
        trusted: true
      };
    default:
      assertNever(t);
  } else assertNever(t);
}
function ie(t) {
  if (null == t) return {
    type: P,
    value: t
  };
  if (Array.isArray(t)) switch (t[0]) {
    case 0:
      return {
        type: P,
        value: t[1]
      };
    case 5:
      return Y(t[1], t[2]);
    case 6:
      return {
        type: G,
        params: oe(t.slice(1))
      };
    case 7:
      return {
        type: M,
        name: t[1]
      };
    case 8:
      return {
        type: D,
        name: t[1]
      };
    default:
      if (le(t)) return ue(t);
      throw new Error(`Unexpected array in expression position (wasn't a tuple expression and ${t[0]} isn't wrapped in parens, so it isn't a call): ${JSON.stringify(t)}`);
  } else if ("object" != typeof t) switch (typeof t) {
    case "string":
      return J(t);
    case "boolean":
    case "number":
      return {
        type: P,
        value: t
      };
    default:
      assertNever(t);
  } else assertNever(t);
}
function le(e) {
  return "string" == typeof e[0] && "(" === e[0][0];
}
function oe(e) {
  return e.map(ie);
}
function ce(e) {
  return null === e ? null : ne(e, ie);
}
function ue(e) {
  switch (e.length) {
    case 1:
      return {
        type: H,
        head: U(e[0]),
        params: null,
        hash: null
      };
    case 2:
      return Array.isArray(e[1]) ? {
        type: H,
        head: U(e[0]),
        params: oe(e[1]),
        hash: null
      } : {
        type: H,
        head: U(e[0]),
        params: null,
        hash: ce(e[1])
      };
    case 3:
      return {
        type: H,
        head: U(e[0]),
        params: oe(e[1]),
        hash: ce(e[2])
      };
  }
}
class pe {
  toSymbols() {
    return this._symbols.slice(1);
  }
  toUpvars() {
    return this._freeVariables;
  }
  freeVar(e) {
    return de(this._freeVariables, e);
  }
  block(e) {
    return this.symbol(e);
  }
  arg(e) {
    return de(this._symbols, e);
  }
  local(e) {
    throw new Error(`No local ${e} was found. Maybe you meant ^${e} for upvar, or !${e} for keyword?`);
  }
  this() {
    return 0;
  }
  hasLocal(e) {
    return false;
  }
  symbol(e) {
    return de(this._symbols, e);
  }
  child(e) {
    return new me(this, e);
  }
  constructor() {
    this._freeVariables = [], this._symbols = ["this"], this.top = this;
  }
}
class me {
  constructor(e, r) {
    this.parent = e, this.locals = dict();
    for (let t of r) this.locals[t] = e.top.symbol(t);
  }
  get paramSymbols() {
    return values(this.locals);
  }
  get top() {
    return this.parent.top;
  }
  freeVar(e) {
    return this.parent.freeVar(e);
  }
  arg(e) {
    return this.parent.arg(e);
  }
  block(e) {
    return this.parent.block(e);
  }
  local(e) {
    return e in this.locals ? this.locals[e] : this.parent.local(e);
  }
  this() {
    return this.parent.this();
  }
  hasLocal(e) {
    return e in this.locals || this.parent.hasLocal(e);
  }
  child(e) {
    return new me(this, e);
  }
}
function de(e, t) {
  let r = e.indexOf(t);
  return -1 === r ? (r = e.length, e.push(t), r) : r;
}
function he(e) {
  return new Error(`unimplemented ${e}`);
}
function fe(e, t) {
  let r = [];
  return e.forEach(e => r.push(...ke(q(e), t))), r;
}
function ye(e, t) {
  let r = [];
  return e.forEach(e => r.push(...ke(e, t))), r;
}
function ke(t, r = new pe()) {
  switch (t.kind) {
    case w:
      return [[t.trusted ? opcodes.TrustingAppend : opcodes.Append, Te(t.path, r)]];
    case A:
      return [[t.trusted ? opcodes.TrustingAppend : opcodes.Append, Se(t.expr, t.trusted ? "TrustedAppend" : "Append", r)]];
    case g:
      {
        let {
            head: e,
            params: a,
            hash: i,
            trusted: l
          } = t,
          o = a ? Ie(a, r) : null,
          c = i ? He(i, r) : null,
          u = Oe(e, l ? resolution.ResolveAsHelperHead : resolution.ResolveAsComponentOrHelperHead, r);
        return [[l ? opcodes.TrustingAppend : opcodes.Append, [opcodes.Call, u, o, c]]];
      }
    case b:
      return [[opcodes.Append, t.value]];
    case C:
      return [[opcodes.Comment, t.value]];
    case k:
      {
        let e = function (e, t, r) {
            let n = [],
              s = [];
            for (const [a, i] of Object.entries(e)) if (n.push(a), "default" === a) {
              let e = r.child(t || []);
              s.push(Le(i, e, e.paramSymbols));
            } else s.push(Le(i, r, []));
            return [n, s];
          }(t.blocks, t.blockParams, r),
          a = He(t.hash, r),
          i = Ie(t.params, r),
          l = Oe(t.head, resolution.ResolveAsComponentHead, r);
        return [[opcodes.Block, l, i, a, e]];
      }
    case S:
      return [be(t, r)];
    case v:
      return function ({
        name: e,
        attrs: t,
        block: r
      }, n) {
        let a = [xe(t) ? [opcodes.OpenElementWithSplat, e] : [opcodes.OpenElement, e]];
        if (t) {
          let {
            params: e
          } = function (e, t) {
            let r = [],
              n = [],
              a = [];
            for (const [i, l] of Object.entries(e)) l === B ? r.push([opcodes.AttrSplat, t.block("&attrs")]) : "@" === i[0] ? (n.push(i), a.push(Se(l, "Strict", t))) : r.push(...Ce(i, l, Ee(i), t));
            return {
              params: r,
              args: z(n) && z(a) ? [n, a] : null
            };
          }(t, n);
          a.push(...e);
        }
        return a.push([opcodes.FlushElement]), Array.isArray(r) && r.forEach(e => a.push(...ke(e, n))), a.push([opcodes.CloseElement]), a;
      }(t, r);
    case x:
      throw he("modifier");
    case E:
      throw he("dynamic component");
    default:
      assertNever(t);
  }
}
function ge(e, ...t) {
  return [0, e.reduce((e, r, n) => e + `${r}${t[n] ? String(t[n]) : ""}`, "")];
}
function ve(e, ...t) {
  return [1, e.reduce((e, r, n) => e + `${r}${t[n] ? String(t[n]) : ""}`, "")];
}
function we(e) {
  return String.fromCharCode(parseInt(e, 16));
}
const Ae = "\n";
function be(e, t) {
  let {
      name: r
    } = e,
    n = Ie(e.params, t),
    a = t.child(e.blockParams || []),
    i = Le(e.blocks.default, a, a.paramSymbols),
    l = e.blocks.else ? Le(e.blocks.else, t, []) : null;
  switch (r) {
    case "let":
      return [opcodes.Let, n, i];
    case "if":
      return [opcodes.If, n[0], i, l];
    case "each":
      {
        let r = e.hash ? e.hash.key : null,
          a = r ? Se(r, "Strict", t) : null;
        return [opcodes.Each, n[0], a, i, l];
      }
    default:
      throw new Error("unimplemented keyword");
  }
}
function xe(e) {
  return null !== e && Object.keys(e).some(t => e[t] === B);
}
function Ee(e) {
  if ("xmlns" === e) return j;
  let t = /^([^:]*):([^:]*)$/u.exec(e);
  if (null === t) return null;
  switch (t[1]) {
    case "xlink":
      return "http://www.w3.org/1999/xlink";
    case "xml":
      return "http://www.w3.org/XML/1998/namespace";
    case "xmlns":
      return j;
  }
  return null;
}
function Ce(e, t, r, n) {
  if (t.type === P) {
    let n = t.value;
    if (false === n) return [];
    if (true === n) return [[opcodes.StaticAttr, e, "", r ?? void 0]];
    if ("string" == typeof n) return [[opcodes.StaticAttr, e, n, r ?? void 0]];
    throw new Error(`Unexpected/unimplemented literal attribute ${JSON.stringify(n)}`);
  }
  return [[opcodes.DynamicAttr, e, Se(t, "AttrValue", n), r ?? void 0]];
}
function Be(e, t) {
  switch (e) {
    case "Append":
      return t ? "AppendBare" : "AppendInvoke";
    case "TrustedAppend":
      return t ? "TrustedAppendBare" : "TrustedAppendInvoke";
    case "AttrValue":
      return t ? "AttrValueBare" : "AttrValueInvoke";
    default:
      return e;
  }
}
function Se(t, r, a) {
  switch (t.type) {
    case L:
      return Te(t, a);
    case $:
      return Ne(t.variable, Be(r, true), a);
    case G:
      return [opcodes.Concat, Pe(t.params, a)];
    case H:
      {
        let e = Ie(t.params, a),
          n = He(t.hash, a),
          i = Oe(t.head, "Strict" === r ? "SubExpression" : Be(r, false), a);
        return [opcodes.Call, i, e, n];
      }
    case M:
      return [opcodes.HasBlock, Ne({
        kind: N,
        name: t.name
      }, resolution.Strict, a)];
    case D:
      return [opcodes.HasBlockParams, Ne({
        kind: N,
        name: t.name
      }, resolution.Strict, a)];
    case P:
      return void 0 === t.value ? [opcodes.Undefined] : t.value;
    default:
      assertNever(t);
  }
}
function Oe(e, t, r) {
  return e.type === $ ? Ne(e.variable, t, r) : Te(e, r);
}
function Te(e, t) {
  return Ne(e.path.head, resolution.Strict, t, e.path.tail);
}
function Ne(e, t, r, a) {
  let i,
    l = opcodes.GetSymbol;
  return e.kind === T ? (l = "Strict" === t ? opcodes.GetStrictKeyword : "AppendBare" === t || "AppendInvoke" === t ? opcodes.GetFreeAsComponentOrHelperHead : "TrustedAppendBare" === t || "TrustedAppendInvoke" === t || "AttrValueBare" === t || "AttrValueInvoke" === t || "SubExpression" === t ? opcodes.GetFreeAsHelperHead : function (e) {
    switch (e) {
      case resolution.Strict:
        return opcodes.GetStrictKeyword;
      case resolution.ResolveAsComponentOrHelperHead:
        return opcodes.GetFreeAsComponentOrHelperHead;
      case resolution.ResolveAsHelperHead:
        return opcodes.GetFreeAsHelperHead;
      case resolution.ResolveAsModifierHead:
        return opcodes.GetFreeAsModifierHead;
      case resolution.ResolveAsComponentHead:
        return opcodes.GetFreeAsComponentHead;
      default:
        return;
    }
  }(t), i = r.freeVar(e.name)) : (l = opcodes.GetSymbol, i = function (e, t, r) {
    switch (e) {
      case "Arg":
        return t.arg(r);
      case N:
        return t.block(r);
      case O:
        return t.local(r);
      case I:
        return t.this();
      default:
        return;
    }
  }(e.kind, r, e.name)), void 0 === a || 0 === a.length ? [l, i] : ([l, i, a]);
}
function Ie(e, t) {
  return null !== e && z(e) ? e.map(e => Se(e, "Strict", t)) : null;
}
function Pe(e, t) {
  return e.map(e => Se(e, "AttrValue", t));
}
function He(e, t) {
  if (null === e) return null;
  let r = [[], []];
  for (const [n, s] of Object.entries(e)) r[0].push(n), r[1].push(Se(s, "Strict", t));
  return r;
}
function Le(e, t, r = []) {
  return [ye(e, t), r];
}
class $e extends te$1("Template").fields() {}
class Ge extends te$1("InElement").fields() {}
class Me extends te$1("Not").fields() {}
class De extends te$1("If").fields() {}
class Ve extends te$1("IfInline").fields() {}
class Fe extends te$1("Each").fields() {}
class _e extends te$1("Let").fields() {}
class je extends te$1("WithDynamicVars").fields() {}
class ze extends te$1("GetDynamicVar").fields() {}
class We extends te$1("Log").fields() {}
class qe extends te$1("InvokeComponent").fields() {}
class Ke extends te$1("NamedBlocks").fields() {}
class Re extends te$1("NamedBlock").fields() {}
class Ue extends te$1("AppendTrustedHTML").fields() {}
class Ye extends te$1("AppendTextNode").fields() {}
class Je extends te$1("AppendComment").fields() {}
class Xe extends te$1("Component").fields() {}
class Ze extends te$1("StaticAttr").fields() {}
class Qe extends te$1("DynamicAttr").fields() {}
class et extends te$1("SimpleElement").fields() {}
class tt extends te$1("ElementParameters").fields() {}
class rt extends te$1("Yield").fields() {}
class nt extends te$1("Debugger").fields() {}
class st extends te$1("CallExpression").fields() {}
class at extends te$1("Modifier").fields() {}
class it extends te$1("InvokeBlock").fields() {}
class lt extends te$1("SplatAttr").fields() {}
class ot extends te$1("PathExpression").fields() {}
class ct extends te$1("Missing").fields() {}
class ut extends te$1("InterpolateExpression").fields() {}
class pt extends te$1("HasBlock").fields() {}
class mt extends te$1("HasBlockParams").fields() {}
class dt extends te$1("Curry").fields() {}
class ht extends te$1("Positional").fields() {}
class ft extends te$1("NamedArguments").fields() {}
class yt extends te$1("NamedArgument").fields() {}
class kt extends te$1("Args").fields() {}
class gt extends te$1("Tail").fields() {}
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
  return "Path" === e.type && "Free" === e.ref.type && e.ref.name in P$1 ? new Ie$1.CallExpression({
    callee: e,
    args: Ie$1.Args.empty(e.loc),
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
    if (r && "Path" === r.type && "Free" === r.ref.type && x$1(r.ref.name)) {
      let {
          name: t
        } = r.ref,
        n = this._type,
        s = P$1[t];
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
    return a = new Ie$1.Args({
      positional: new Ie$1.PositionalArguments({
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
    if (!s || s.isEmpty()) return Bt(j$1.synthetic("default"));
    if (1 === s.exprs.length) {
      let t = s.exprs[0];
      return Ie$1.isLiteral(t, "string") ? Bt(t.toSlice()) : St(ot$1(`(${e}) can only receive a string literal as its first argument`, r.loc));
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
        return t.named.size > 1 || null === e ? St(ot$1("yield only takes a single named argument: 'to'", t.named.loc)) : Ie$1.isLiteral(e, "string") ? Bt({
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
    div: WellKnownTagNames.div,
    span: WellKnownTagNames.span,
    p: WellKnownTagNames.p,
    a: WellKnownTagNames.a
  },
  ar = ["div", "span", "p", "a"];
function ir(e) {
  return "string" == typeof e ? e : ar[e];
}
const lr = {
    class: WellKnownAttrNames.class,
    id: WellKnownAttrNames.id,
    value: WellKnownAttrNames.value,
    name: WellKnownAttrNames.name,
    type: WellKnownAttrNames.type,
    style: WellKnownAttrNames.style,
    href: WellKnownAttrNames.href
  },
  or = ["class", "id", "value", "name", "type", "style", "href"];
function cr(e) {
  return lr[e] ?? e;
}
function ur(e) {
  return "string" == typeof e ? e : or[e];
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
    return Ie$1.isLiteral(r, "string") ? Bt(new Ze({
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
      text: new Ie$1.LiteralExpression({
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
class wr {
  constructor([e, t, r]) {
    this.upvars = r, this.symbols = t;
  }
  format(e) {
    let t = [];
    for (let r of e[0]) t.push(this.formatOpcode(r));
    return t;
  }
  formatOpcode(e) {
    if (!Array.isArray(e)) return e;
    switch (e[0]) {
      case opcodes.Append:
        return ["append", this.formatOpcode(e[1])];
      case opcodes.TrustingAppend:
        return ["trusting-append", this.formatOpcode(e[1])];
      case opcodes.Block:
        return ["block", this.formatOpcode(e[1]), this.formatParams(e[2]), this.formatHash(e[3]), this.formatBlocks(e[4])];
      case opcodes.InElement:
        return ["in-element", e[1], this.formatOpcode(e[2]), e[3] ? this.formatOpcode(e[3]) : void 0];
      case opcodes.OpenElement:
        return ["open-element", ir(e[1])];
      case opcodes.OpenElementWithSplat:
        return ["open-element-with-splat", ir(e[1])];
      case opcodes.CloseElement:
        return ["close-element"];
      case opcodes.FlushElement:
        return ["flush-element"];
      case opcodes.StaticAttr:
        return ["static-attr", ur(e[1]), e[2], e[3]];
      case opcodes.StaticComponentAttr:
        return ["static-component-attr", ur(e[1]), e[2], e[3]];
      case opcodes.DynamicAttr:
        return ["dynamic-attr", ur(e[1]), this.formatOpcode(e[2]), e[3]];
      case opcodes.ComponentAttr:
        return ["component-attr", ur(e[1]), this.formatOpcode(e[2]), e[3]];
      case opcodes.AttrSplat:
        return ["attr-splat"];
      case opcodes.Yield:
        return ["yield", e[1], this.formatParams(e[2])];
      case opcodes.DynamicArg:
        return ["dynamic-arg", e[1], this.formatOpcode(e[2])];
      case opcodes.StaticArg:
        return ["static-arg", e[1], this.formatOpcode(e[2])];
      case opcodes.TrustingDynamicAttr:
        return ["trusting-dynamic-attr", ur(e[1]), this.formatOpcode(e[2]), e[3]];
      case opcodes.TrustingComponentAttr:
        return ["trusting-component-attr", ur(e[1]), this.formatOpcode(e[2]), e[3]];
      case opcodes.Debugger:
        return ["debugger", e[1]];
      case opcodes.Comment:
        return ["comment", e[1]];
      case opcodes.Modifier:
        return ["modifier", this.formatOpcode(e[1]), this.formatParams(e[2]), this.formatHash(e[3])];
      case opcodes.Component:
        return ["component", this.formatOpcode(e[1]), this.formatElementParams(e[2]), this.formatHash(e[3]), this.formatBlocks(e[4])];
      case opcodes.HasBlock:
        return ["has-block", this.formatOpcode(e[1])];
      case opcodes.HasBlockParams:
        return ["has-block-params", this.formatOpcode(e[1])];
      case opcodes.Curry:
        return ["curry", this.formatOpcode(e[1]), this.formatCurryType(e[2]), this.formatParams(e[3]), this.formatHash(e[4])];
      case opcodes.Undefined:
        return ["undefined"];
      case opcodes.Call:
        return ["call", this.formatOpcode(e[1]), this.formatParams(e[2]), this.formatHash(e[3])];
      case opcodes.Concat:
        return ["concat", this.formatParams(e[1])];
      case opcodes.GetStrictKeyword:
        return ["get-strict-free", this.upvars[e[1]]];
      case opcodes.GetFreeAsComponentOrHelperHead:
        return ["GetFreeAsComponentOrHelperHead", this.upvars[e[1]], e[2]];
      case opcodes.GetFreeAsHelperHead:
        return ["GetFreeAsHelperHead", this.upvars[e[1]], e[2]];
      case opcodes.GetFreeAsComponentHead:
        return ["GetFreeAsComponentHead", this.upvars[e[1]], e[2]];
      case opcodes.GetFreeAsModifierHead:
        return ["GetFreeAsModifierHead", this.upvars[e[1]], e[2]];
      case opcodes.GetSymbol:
        return 0 === e[1] ? ["get-symbol", "this", e[2]] : ["get-symbol", this.symbols[e[1] - 1], e[2]];
      case opcodes.GetLexicalSymbol:
        return ["get-template-symbol", e[1], e[2]];
      case opcodes.If:
        return ["if", this.formatOpcode(e[1]), this.formatBlock(e[2]), e[3] ? this.formatBlock(e[3]) : null];
      case opcodes.IfInline:
        return ["if-inline"];
      case opcodes.Not:
        return ["not"];
      case opcodes.Each:
        return ["each", this.formatOpcode(e[1]), e[2] ? this.formatOpcode(e[2]) : null, this.formatBlock(e[3]), e[4] ? this.formatBlock(e[4]) : null];
      case opcodes.Let:
        return ["let", this.formatParams(e[1]), this.formatBlock(e[2])];
      case opcodes.Log:
        return ["log", this.formatParams(e[1])];
      case opcodes.WithDynamicVars:
        return ["-with-dynamic-vars", this.formatHash(e[1]), this.formatBlock(e[2])];
      case opcodes.GetDynamicVar:
        return ["-get-dynamic-vars", this.formatOpcode(e[1])];
      case opcodes.InvokeComponent:
        return ["component", this.formatOpcode(e[1]), this.formatParams(e[2]), this.formatHash(e[3]), this.formatBlocks(e[4])];
    }
  }
  formatCurryType(e) {
    switch (e) {
      case 0:
        return "component";
      case 1:
        return "helper";
      case 2:
        return "modifier";
    }
  }
  formatElementParams(e) {
    return null === e ? null : e.map(e => this.formatOpcode(e));
  }
  formatParams(e) {
    return null === e ? null : e.map(e => this.formatOpcode(e));
  }
  formatHash(e) {
    return null === e ? null : e[0].reduce((t, r, n) => (t[r] = this.formatOpcode(e[1][n]), t), dict());
  }
  formatBlocks(e) {
    return null === e ? null : e[0].reduce((t, r, n) => (t[r] = this.formatBlock(e[1][n]), t), dict());
  }
  formatBlock(e) {
    return {
      statements: e[0].map(e => this.formatOpcode(e)),
      parameters: e[1]
    };
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
        return [opcodes.GetSymbol, e.symbol];
      case "Local":
        return this.Local(e);
      case "This":
        return [opcodes.GetSymbol, 0];
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
    return void 0 === e ? [opcodes.Undefined] : e;
  }
  Missing() {}
  HasBlock({
    symbol: e
  }) {
    return [opcodes.HasBlock, [opcodes.GetSymbol, e]];
  }
  HasBlockParams({
    symbol: e
  }) {
    return [opcodes.HasBlockParams, [opcodes.GetSymbol, e]];
  }
  Curry({
    definition: e,
    curriedType: t,
    args: r
  }) {
    return [opcodes.Curry, Ar.expr(e), t, Ar.Positional(r.positional), Ar.NamedArguments(r.named)];
  }
  Local({
    isTemplateLocal: e,
    symbol: t
  }) {
    return [e ? opcodes.GetLexicalSymbol : opcodes.GetSymbol, t];
  }
  Keyword({
    symbol: e
  }) {
    return [opcodes.GetStrictKeyword, e];
  }
  PathExpression({
    head: e,
    tail: t
  }) {
    let r = Ar.expr(e);
    return r[0], [...r, Ar.Tail(t)];
  }
  InterpolateExpression({
    parts: e
  }) {
    return [opcodes.Concat, e.map(e => Ar.expr(e)).toArray()];
  }
  CallExpression({
    callee: e,
    args: t
  }) {
    return [opcodes.Call, Ar.expr(e), ...Ar.Args(t)];
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
    return [opcodes.Not, Ar.expr(e)];
  }
  IfInline({
    condition: e,
    truthy: t,
    falsy: r
  }) {
    let n = [opcodes.IfInline, Ar.expr(e), Ar.expr(t)];
    return r && n.push(Ar.expr(r)), n;
  }
  GetDynamicVar({
    name: e
  }) {
    return [opcodes.GetDynamicVar, Ar.expr(e)];
  }
  Log({
    positional: e
  }) {
    return [opcodes.Log, this.Positional(e)];
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
        return [opcodes.Debugger, ...e.scope.getDebugInfo(), {}];
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
    positional: t
  }) {
    return [opcodes.Yield, e, Ar.Positional(t)];
  }
  InElement({
    guid: e,
    insertBefore: t,
    destination: r,
    block: n
  }) {
    let a = xr.NamedBlock(n)[1],
      i = Ar.expr(r),
      l = Ar.expr(t);
    return void 0 === l ? [opcodes.InElement, a, e, i] : [opcodes.InElement, a, e, i, l];
  }
  InvokeBlock({
    head: e,
    args: t,
    blocks: r
  }) {
    return [opcodes.Block, Ar.expr(e), ...Ar.Args(t), xr.NamedBlocks(r)];
  }
  AppendTrustedHTML({
    html: e
  }) {
    return [opcodes.TrustingAppend, Ar.expr(e)];
  }
  AppendTextNode({
    text: e
  }) {
    return [opcodes.Append, Ar.expr(e)];
  }
  AppendComment({
    value: e
  }) {
    return [opcodes.Comment, e.chars];
  }
  SimpleElement({
    tag: e,
    params: t,
    body: r,
    dynamicFeatures: n
  }) {
    let a = n ? opcodes.OpenElementWithSplat : opcodes.OpenElement;
    return new br([[a, (i = e.chars, sr[i] ?? i)], ...xr.ElementParameters(t).toArray(), [opcodes.FlushElement], ...xr.list(r), [opcodes.CloseElement]]);
    var i;
  }
  Component({
    tag: e,
    params: t,
    args: r,
    blocks: n
  }) {
    let a = Ar.expr(e),
      i = xr.ElementParameters(t),
      l = Ar.NamedArguments(r),
      o = xr.NamedBlocks(n);
    return [opcodes.Component, a, i.toPresentArray(), l, o];
  }
  ElementParameters({
    body: e
  }) {
    return e.map(e => xr.ElementParameter(e));
  }
  ElementParameter(e) {
    switch (e.type) {
      case "SplatAttr":
        return [opcodes.AttrSplat, e.symbol];
      case "DynamicAttr":
        return [(t = e.kind, t.component ? t.trusting ? opcodes.TrustingComponentAttr : opcodes.ComponentAttr : t.trusting ? opcodes.TrustingDynamicAttr : opcodes.DynamicAttr), ...Cr(e)];
      case "StaticAttr":
        return [Br(e.kind), ...Er(e)];
      case "Modifier":
        return [opcodes.Modifier, Ar.expr(e.callee), ...Ar.Args(e.args)];
    }
    var t;
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
    block: t,
    inverse: r
  }) {
    return [opcodes.If, Ar.expr(e), xr.NamedBlock(t)[1], r ? xr.NamedBlock(r)[1] : null];
  }
  Each({
    value: e,
    key: t,
    block: r,
    inverse: n
  }) {
    return [opcodes.Each, Ar.expr(e), t ? Ar.expr(t) : null, xr.NamedBlock(r)[1], n ? xr.NamedBlock(n)[1] : null];
  }
  Let({
    positional: e,
    block: t
  }) {
    return [opcodes.Let, Ar.Positional(e), xr.NamedBlock(t)[1]];
  }
  WithDynamicVars({
    named: e,
    block: t
  }) {
    return [opcodes.WithDynamicVars, Ar.NamedArguments(e), xr.NamedBlock(t)[1]];
  }
  InvokeComponent({
    definition: e,
    args: t,
    blocks: r
  }) {
    return [opcodes.InvokeComponent, Ar.expr(e), Ar.Positional(t.positional), Ar.NamedArguments(t.named), r ? xr.NamedBlocks(r) : null];
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
  return e.component ? opcodes.StaticComponentAttr : opcodes.StaticAttr;
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
const Nr = "796d24e6-2450-4fb0-8cdf-b65638b5ef70";
function Ir(e, t = Or) {
  const [r, n] = Tr(e, t);
  "emit" in t && t.emit?.debugSymbols && n.length > 0 && r.push(n);
  const s = t.meta?.moduleName,
    a = t.id || Sr,
    i = JSON.stringify(r),
    l = {
      id: a(JSON.stringify(t.meta) + i),
      block: i,
      moduleName: s ?? "(unknown template module)",
      scope: Nr,
      isStrictMode: t.strictMode ?? false
    };
  0 === n.length && delete l.scope;
  let o = JSON.stringify(l);
  if (n.length > 0) {
    const e = `()=>[${n.join(",")}]`;
    o = o.replace(`"${Nr}"`, e);
  }
  return o;
}

const _importSync20 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	NEWLINE: Ae,
	ProgramSymbols: pe,
	WireFormatDebugger: wr,
	buildStatement: ke,
	buildStatements: fe,
	c: ve,
	defaultId: Sr,
	precompile: Ir,
	precompileJSON: Tr,
	s: ge,
	unicode: we
}, Symbol.toStringTag, { value: 'Module' }));

export { Tr as T, _importSync20 as _ };
