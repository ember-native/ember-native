let _;const w=new Array(128).fill(void 0);w.push(void 0,null,!0,!1);function c(n){return w[n]}let A=w.length;function $(n){n<132||(w[n]=A,A=n)}function d(n){const e=c(n);return $(n),e}const M=typeof TextDecoder<"u"?new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0}):{decode:()=>{throw Error("TextDecoder not available")}};typeof TextDecoder<"u"&&M.decode();let p=null;function S(){return(p===null||p.byteLength===0)&&(p=new Uint8Array(_.memory.buffer)),p}function T(n,e){return n=n>>>0,M.decode(S().subarray(n,n+e))}function i(n){A===w.length&&w.push(w.length+1);const e=A;return A=w[e],w[e]=n,e}function k(n){const e=typeof n;if(e=="number"||e=="boolean"||n==null)return`${n}`;if(e=="string")return`"${n}"`;if(e=="symbol"){const o=n.description;return o==null?"Symbol":`Symbol(${o})`}if(e=="function"){const o=n.name;return typeof o=="string"&&o.length>0?`Function(${o})`:"Function"}if(Array.isArray(n)){const o=n.length;let a="[";o>0&&(a+=k(n[0]));for(let s=1;s<o;s++)a+=", "+k(n[s]);return a+="]",a}const t=/\[object ([^\]]+)\]/.exec(toString.call(n));let r;if(t.length>1)r=t[1];else return toString.call(n);if(r=="Object")try{return"Object("+JSON.stringify(n)+")"}catch{return"Object"}return n instanceof Error?`${n.name}: ${n.message}
${n.stack}`:r}let l=0;const j=typeof TextEncoder<"u"?new TextEncoder("utf-8"):{encode:()=>{throw Error("TextEncoder not available")}},D=typeof j.encodeInto=="function"?function(n,e){return j.encodeInto(n,e)}:function(n,e){const t=j.encode(n);return e.set(t),{read:n.length,written:t.length}};function m(n,e,t){if(t===void 0){const u=j.encode(n),f=e(u.length,1)>>>0;return S().subarray(f,f+u.length).set(u),l=u.length,f}let r=n.length,o=e(r,1)>>>0;const a=S();let s=0;for(;s<r;s++){const u=n.charCodeAt(s);if(u>127)break;a[o+s]=u}if(s!==r){s!==0&&(n=n.slice(s)),o=t(o,r,r=s+n.length*3,1)>>>0;const u=S().subarray(o+s,o+r),f=D(n,u);s+=f.written}return l=s,o}let h=null;function g(){return(h===null||h.byteLength===0)&&(h=new Int32Array(_.memory.buffer)),h}function W(n){return n==null}function b(n,e){try{return n.apply(this,e)}catch(t){_.__wbindgen_exn_store(i(t))}}const v=new FinalizationRegistry(n=>_.__wbg_preprocessor_free(n>>>0));class F{static __wrap(e){e=e>>>0;const t=Object.create(F.prototype);return t.__wbg_ptr=e,v.register(t,t.__wbg_ptr,t),t}__destroy_into_raw(){const e=this.__wbg_ptr;return this.__wbg_ptr=0,v.unregister(this),e}free(){const e=this.__destroy_into_raw();_.__wbg_preprocessor_free(e)}constructor(){const e=_.preprocessor_new();return F.__wrap(e)}process(e,t){let r,o;try{const y=_.__wbindgen_add_to_stack_pointer(-16),I=m(e,_.__wbindgen_malloc,_.__wbindgen_realloc),L=l;var a=W(t)?0:m(t,_.__wbindgen_malloc,_.__wbindgen_realloc),s=l;_.preprocessor_process(y,this.__wbg_ptr,I,L,a,s);var u=g()[y/4+0],f=g()[y/4+1],E=g()[y/4+2],O=g()[y/4+3],x=u,R=f;if(O)throw x=0,R=0,d(E);return r=x,o=R,T(x,R)}finally{_.__wbindgen_add_to_stack_pointer(16),_.__wbindgen_free(r,o,1)}}parse(e,t){try{const f=_.__wbindgen_add_to_stack_pointer(-16),E=m(e,_.__wbindgen_malloc,_.__wbindgen_realloc),O=l;var r=W(t)?0:m(t,_.__wbindgen_malloc,_.__wbindgen_realloc),o=l;_.preprocessor_parse(f,this.__wbg_ptr,E,O,r,o);var a=g()[f/4+0],s=g()[f/4+1],u=g()[f/4+2];if(u)throw d(s);return d(a)}finally{_.__wbindgen_add_to_stack_pointer(16)}}}async function C(n,e){if(typeof Response=="function"&&n instanceof Response){if(typeof WebAssembly.instantiateStreaming=="function")try{return await WebAssembly.instantiateStreaming(n,e)}catch(r){if(n.headers.get("Content-Type")!="application/wasm")console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",r);else throw r}const t=await n.arrayBuffer();return await WebAssembly.instantiate(t,e)}else{const t=await WebAssembly.instantiate(n,e);return t instanceof WebAssembly.Instance?{instance:t,module:n}:t}}function N(){const n={};return n.wbg={},n.wbg.__wbindgen_object_drop_ref=function(e){d(e)},n.wbg.__wbindgen_string_new=function(e,t){const r=T(e,t);return i(r)},n.wbg.__wbg_Error_58015c683709e145=function(e){const t=Error(d(e));return i(t)},n.wbg.__wbg_parse_181a91d066d1f7fe=function(e){const t=JSON.parse(d(e));return i(t)},n.wbg.__wbindgen_is_object=function(e){const t=c(e);return typeof t=="object"&&t!==null},n.wbg.__wbg_crypto_c48a774b022d20ac=function(e){const t=c(e).crypto;return i(t)},n.wbg.__wbg_process_298734cf255a885d=function(e){const t=c(e).process;return i(t)},n.wbg.__wbg_versions_e2e78e134e3e5d01=function(e){const t=c(e).versions;return i(t)},n.wbg.__wbg_node_1cd7a5d853dbea79=function(e){const t=c(e).node;return i(t)},n.wbg.__wbindgen_is_string=function(e){return typeof c(e)=="string"},n.wbg.__wbg_require_8f08ceecec0f4fee=function(){return b(function(){const e=module.require;return i(e)},arguments)},n.wbg.__wbg_msCrypto_bcb970640f50a1e8=function(e){const t=c(e).msCrypto;return i(t)},n.wbg.__wbg_randomFillSync_dc1e9a60c158336d=function(){return b(function(e,t){c(e).randomFillSync(d(t))},arguments)},n.wbg.__wbg_getRandomValues_37fa2ca9e4e07fab=function(){return b(function(e,t){c(e).getRandomValues(c(t))},arguments)},n.wbg.__wbindgen_is_function=function(e){return typeof c(e)=="function"},n.wbg.__wbg_self_1ff1d729e9aae938=function(){return b(function(){const e=self.self;return i(e)},arguments)},n.wbg.__wbg_window_5f4faef6c12b79ec=function(){return b(function(){const e=window.window;return i(e)},arguments)},n.wbg.__wbg_globalThis_1d39714405582d3c=function(){return b(function(){const e=globalThis.globalThis;return i(e)},arguments)},n.wbg.__wbg_global_651f05c6a0944d1c=function(){return b(function(){const e=global.global;return i(e)},arguments)},n.wbg.__wbindgen_is_undefined=function(e){return c(e)===void 0},n.wbg.__wbg_newnoargs_581967eacc0e2604=function(e,t){const r=new Function(T(e,t));return i(r)},n.wbg.__wbindgen_object_clone_ref=function(e){const t=c(e);return i(t)},n.wbg.__wbg_call_cb65541d95d71282=function(){return b(function(e,t){const r=c(e).call(c(t));return i(r)},arguments)},n.wbg.__wbg_call_01734de55d61e11d=function(){return b(function(e,t,r){const o=c(e).call(c(t),c(r));return i(o)},arguments)},n.wbg.__wbg_set_092e06b0f9d71865=function(){return b(function(e,t,r){return Reflect.set(c(e),c(t),c(r))},arguments)},n.wbg.__wbg_buffer_085ec1f694018c4f=function(e){const t=c(e).buffer;return i(t)},n.wbg.__wbg_newwithbyteoffsetandlength_6da8e527659b86aa=function(e,t,r){const o=new Uint8Array(c(e),t>>>0,r>>>0);return i(o)},n.wbg.__wbg_new_8125e318e6245eed=function(e){const t=new Uint8Array(c(e));return i(t)},n.wbg.__wbg_newwithlength_e5d69174d6984cd7=function(e){const t=new Uint8Array(e>>>0);return i(t)},n.wbg.__wbg_subarray_13db269f57aa838d=function(e,t,r){const o=c(e).subarray(t>>>0,r>>>0);return i(o)},n.wbg.__wbg_set_5cf90238115182c3=function(e,t,r){c(e).set(c(t),r>>>0)},n.wbg.__wbindgen_debug_string=function(e,t){const r=k(c(t)),o=m(r,_.__wbindgen_malloc,_.__wbindgen_realloc),a=l;g()[e/4+1]=a,g()[e/4+0]=o},n.wbg.__wbindgen_throw=function(e,t){throw new Error(T(e,t))},n.wbg.__wbindgen_memory=function(){const e=_.memory;return i(e)},n}function q(n,e){return _=n.exports,U.__wbindgen_wasm_module=e,h=null,p=null,_}async function U(n){if(_!==void 0)return _;typeof n>"u"&&(n=new URL("/ember-native/versions/v1.3.0-ember-native/assets/content_tag_bg-k1TghDsu.wasm",import.meta.url));const e=N();(typeof n=="string"||typeof Request=="function"&&n instanceof Request||typeof URL=="function"&&n instanceof URL)&&(n=fetch(n));const{instance:t,module:r}=await C(await n,e);return q(t,r)}await U();export{F as Preprocessor};
