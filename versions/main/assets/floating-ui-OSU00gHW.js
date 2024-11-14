import{v as Dt,_ as $t,j as yt,u as vt,k as bt,s as jt,a as zt,h as It}from"./main-CSQmYVW1.js";const Yt=["top","right","bottom","left"],I=Math.min,W=Math.max,nt=Math.round,et=Math.floor,S=t=>({x:t,y:t}),Ut={left:"right",right:"left",bottom:"top",top:"bottom"},qt={start:"end",end:"start"};function at(t,e,n){return W(t,I(e,n))}function q(t,e){return typeof t=="function"?t(e):t}function _(t){return t.split("-")[0]}function Q(t){return t.split("-")[1]}function Et(t){return t==="x"?"y":"x"}function mt(t){return t==="y"?"height":"width"}function Y(t){return["top","bottom"].includes(_(t))?"y":"x"}function ht(t){return Et(Y(t))}function Xt(t,e,n){n===void 0&&(n=!1);const o=Q(t),i=ht(t),r=mt(i);let s=i==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return e.reference[r]>e.floating[r]&&(s=ot(s)),[s,ot(s)]}function Kt(t){const e=ot(t);return[ut(t),e,ut(e)]}function ut(t){return t.replace(/start|end/g,e=>qt[e])}function Gt(t,e,n){const o=["left","right"],i=["right","left"],r=["top","bottom"],s=["bottom","top"];switch(t){case"top":case"bottom":return n?e?i:o:e?o:i;case"left":case"right":return e?r:s;default:return[]}}function Jt(t,e,n,o){const i=Q(t);let r=Gt(_(t),n==="start",o);return i&&(r=r.map(s=>s+"-"+i),e&&(r=r.concat(r.map(ut)))),r}function ot(t){return t.replace(/left|right|bottom|top/g,e=>Ut[e])}function Zt(t){return{top:0,right:0,bottom:0,left:0,...t}}function Pt(t){return typeof t!="number"?Zt(t):{top:t,right:t,bottom:t,left:t}}function it(t){const{x:e,y:n,width:o,height:i}=t;return{width:o,height:i,top:n,left:e,right:e+o,bottom:n+i,x:e,y:n}}function Ot(t,e,n){let{reference:o,floating:i}=t;const r=Y(e),s=ht(e),c=mt(s),f=_(e),l=r==="y",d=o.x+o.width/2-i.width/2,u=o.y+o.height/2-i.height/2,m=o[c]/2-i[c]/2;let a;switch(f){case"top":a={x:d,y:o.y-i.height};break;case"bottom":a={x:d,y:o.y+o.height};break;case"right":a={x:o.x+o.width,y:u};break;case"left":a={x:o.x-i.width,y:u};break;default:a={x:o.x,y:o.y}}switch(Q(e)){case"start":a[s]-=m*(n&&l?-1:1);break;case"end":a[s]+=m*(n&&l?-1:1);break}return a}const Qt=async(t,e,n)=>{const{placement:o="bottom",strategy:i="absolute",middleware:r=[],platform:s}=n,c=r.filter(Boolean),f=await(s.isRTL==null?void 0:s.isRTL(e));let l=await s.getElementRects({reference:t,floating:e,strategy:i}),{x:d,y:u}=Ot(l,o,f),m=o,a={},h=0;for(let p=0;p<c.length;p++){const{name:w,fn:g}=c[p],{x,y,data:b,reset:v}=await g({x:d,y:u,initialPlacement:o,placement:m,strategy:i,middlewareData:a,rects:l,platform:s,elements:{reference:t,floating:e}});d=x??d,u=y??u,a={...a,[w]:{...a[w],...b}},v&&h<=50&&(h++,typeof v=="object"&&(v.placement&&(m=v.placement),v.rects&&(l=v.rects===!0?await s.getElementRects({reference:t,floating:e,strategy:i}):v.rects),{x:d,y:u}=Ot(l,m,f)),p=-1)}return{x:d,y:u,placement:m,strategy:i,middlewareData:a}};async function st(t,e){var n;e===void 0&&(e={});const{x:o,y:i,platform:r,rects:s,elements:c,strategy:f}=t,{boundary:l="clippingAncestors",rootBoundary:d="viewport",elementContext:u="floating",altBoundary:m=!1,padding:a=0}=q(e,t),h=Pt(a),w=c[m?u==="floating"?"reference":"floating":u],g=it(await r.getClippingRect({element:(n=await(r.isElement==null?void 0:r.isElement(w)))==null||n?w:w.contextElement||await(r.getDocumentElement==null?void 0:r.getDocumentElement(c.floating)),boundary:l,rootBoundary:d,strategy:f})),x=u==="floating"?{x:o,y:i,width:s.floating.width,height:s.floating.height}:s.reference,y=await(r.getOffsetParent==null?void 0:r.getOffsetParent(c.floating)),b=await(r.isElement==null?void 0:r.isElement(y))?await(r.getScale==null?void 0:r.getScale(y))||{x:1,y:1}:{x:1,y:1},v=it(r.convertOffsetParentRelativeRectToViewportRelativeRect?await r.convertOffsetParentRelativeRectToViewportRelativeRect({elements:c,rect:x,offsetParent:y,strategy:f}):x);return{top:(g.top-v.top+h.top)/b.y,bottom:(v.bottom-g.bottom+h.bottom)/b.y,left:(g.left-v.left+h.left)/b.x,right:(v.right-g.right+h.right)/b.x}}const te=t=>({name:"arrow",options:t,async fn(e){const{x:n,y:o,placement:i,rects:r,platform:s,elements:c,middlewareData:f}=e,{element:l,padding:d=0}=q(t,e)||{};if(l==null)return{};const u=Pt(d),m={x:n,y:o},a=ht(i),h=mt(a),p=await s.getDimensions(l),w=a==="y",g=w?"top":"left",x=w?"bottom":"right",y=w?"clientHeight":"clientWidth",b=r.reference[h]+r.reference[a]-m[a]-r.floating[h],v=m[a]-r.reference[a],T=await(s.getOffsetParent==null?void 0:s.getOffsetParent(l));let B=T?T[y]:0;(!B||!await(s.isElement==null?void 0:s.isElement(T)))&&(B=c.floating[y]||r.floating[h]);const K=b/2-v/2,N=B/2-p[h]/2-1,k=I(u[g],N),G=I(u[x],N),V=k,J=B-p[h]-G,O=B/2-p[h]/2+K,j=at(V,O,J),P=!f.arrow&&Q(i)!=null&&O!==j&&r.reference[h]/2-(O<V?k:G)-p[h]/2<0,L=P?O<V?O-V:O-J:0;return{[a]:m[a]+L,data:{[a]:j,centerOffset:O-j-L,...P&&{alignmentOffset:L}},reset:P}}}),ee=function(t){return t===void 0&&(t={}),{name:"flip",options:t,async fn(e){var n,o;const{placement:i,middlewareData:r,rects:s,initialPlacement:c,platform:f,elements:l}=e,{mainAxis:d=!0,crossAxis:u=!0,fallbackPlacements:m,fallbackStrategy:a="bestFit",fallbackAxisSideDirection:h="none",flipAlignment:p=!0,...w}=q(t,e);if((n=r.arrow)!=null&&n.alignmentOffset)return{};const g=_(i),x=Y(c),y=_(c)===c,b=await(f.isRTL==null?void 0:f.isRTL(l.floating)),v=m||(y||!p?[ot(c)]:Kt(c)),T=h!=="none";!m&&T&&v.push(...Jt(c,p,h,b));const B=[c,...v],K=await st(e,w),N=[];let k=((o=r.flip)==null?void 0:o.overflows)||[];if(d&&N.push(K[g]),u){const O=Xt(i,s,b);N.push(K[O[0]],K[O[1]])}if(k=[...k,{placement:i,overflows:N}],!N.every(O=>O<=0)){var G,V;const O=(((G=r.flip)==null?void 0:G.index)||0)+1,j=B[O];if(j)return{data:{index:O,overflows:k},reset:{placement:j}};let P=(V=k.filter(L=>L.overflows[0]<=0).sort((L,F)=>L.overflows[1]-F.overflows[1])[0])==null?void 0:V.placement;if(!P)switch(a){case"bestFit":{var J;const L=(J=k.filter(F=>{if(T){const M=Y(F.placement);return M===x||M==="y"}return!0}).map(F=>[F.placement,F.overflows.filter(M=>M>0).reduce((M,_t)=>M+_t,0)]).sort((F,M)=>F[1]-M[1])[0])==null?void 0:J[0];L&&(P=L);break}case"initialPlacement":P=c;break}if(i!==P)return{reset:{placement:P}}}return{}}}};function At(t,e){return{top:t.top-e.height,right:t.right-e.width,bottom:t.bottom-e.height,left:t.left-e.width}}function Rt(t){return Yt.some(e=>t[e]>=0)}const ne=function(t){return t===void 0&&(t={}),{name:"hide",options:t,async fn(e){const{rects:n}=e,{strategy:o="referenceHidden",...i}=q(t,e);switch(o){case"referenceHidden":{const r=await st(e,{...i,elementContext:"reference"}),s=At(r,n.reference);return{data:{referenceHiddenOffsets:s,referenceHidden:Rt(s)}}}case"escaped":{const r=await st(e,{...i,altBoundary:!0}),s=At(r,n.floating);return{data:{escapedOffsets:s,escaped:Rt(s)}}}default:return{}}}}};async function oe(t,e){const{placement:n,platform:o,elements:i}=t,r=await(o.isRTL==null?void 0:o.isRTL(i.floating)),s=_(n),c=Q(n),f=Y(n)==="y",l=["left","top"].includes(s)?-1:1,d=r&&f?-1:1,u=q(e,t);let{mainAxis:m,crossAxis:a,alignmentAxis:h}=typeof u=="number"?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:u.mainAxis||0,crossAxis:u.crossAxis||0,alignmentAxis:u.alignmentAxis};return c&&typeof h=="number"&&(a=c==="end"?h*-1:h),f?{x:a*d,y:m*l}:{x:m*l,y:a*d}}const ie=function(t){return t===void 0&&(t=0),{name:"offset",options:t,async fn(e){var n,o;const{x:i,y:r,placement:s,middlewareData:c}=e,f=await oe(e,t);return s===((n=c.offset)==null?void 0:n.placement)&&(o=c.arrow)!=null&&o.alignmentOffset?{}:{x:i+f.x,y:r+f.y,data:{...f,placement:s}}}}},se=function(t){return t===void 0&&(t={}),{name:"shift",options:t,async fn(e){const{x:n,y:o,placement:i}=e,{mainAxis:r=!0,crossAxis:s=!1,limiter:c={fn:w=>{let{x:g,y:x}=w;return{x:g,y:x}}},...f}=q(t,e),l={x:n,y:o},d=await st(e,f),u=Y(_(i)),m=Et(u);let a=l[m],h=l[u];if(r){const w=m==="y"?"top":"left",g=m==="y"?"bottom":"right",x=a+d[w],y=a-d[g];a=at(x,a,y)}if(s){const w=u==="y"?"top":"left",g=u==="y"?"bottom":"right",x=h+d[w],y=h-d[g];h=at(x,h,y)}const p=c.fn({...e,[m]:a,[u]:h});return{...p,data:{x:p.x-n,y:p.y-o,enabled:{[m]:r,[u]:s}}}}}};function rt(){return typeof window<"u"}function X(t){return kt(t)?(t.nodeName||"").toLowerCase():"#document"}function A(t){var e;return(t==null||(e=t.ownerDocument)==null?void 0:e.defaultView)||window}function E(t){var e;return(e=(kt(t)?t.ownerDocument:t.document)||window.document)==null?void 0:e.documentElement}function kt(t){return rt()?t instanceof Node||t instanceof A(t).Node:!1}function R(t){return rt()?t instanceof Element||t instanceof A(t).Element:!1}function D(t){return rt()?t instanceof HTMLElement||t instanceof A(t).HTMLElement:!1}function Ct(t){return!rt()||typeof ShadowRoot>"u"?!1:t instanceof ShadowRoot||t instanceof A(t).ShadowRoot}function tt(t){const{overflow:e,overflowX:n,overflowY:o,display:i}=C(t);return/auto|scroll|overlay|hidden|clip/.test(e+o+n)&&!["inline","contents"].includes(i)}function re(t){return["table","td","th"].includes(X(t))}function ct(t){return[":popover-open",":modal"].some(e=>{try{return t.matches(e)}catch{return!1}})}function pt(t){const e=gt(),n=R(t)?C(t):t;return n.transform!=="none"||n.perspective!=="none"||(n.containerType?n.containerType!=="normal":!1)||!e&&(n.backdropFilter?n.backdropFilter!=="none":!1)||!e&&(n.filter?n.filter!=="none":!1)||["transform","perspective","filter"].some(o=>(n.willChange||"").includes(o))||["paint","layout","strict","content"].some(o=>(n.contain||"").includes(o))}function ce(t){let e=H(t);for(;D(e)&&!U(e);){if(pt(e))return e;if(ct(e))return null;e=H(e)}return null}function gt(){return typeof CSS>"u"||!CSS.supports?!1:CSS.supports("-webkit-backdrop-filter","none")}function U(t){return["html","body","#document"].includes(X(t))}function C(t){return A(t).getComputedStyle(t)}function lt(t){return R(t)?{scrollLeft:t.scrollLeft,scrollTop:t.scrollTop}:{scrollLeft:t.scrollX,scrollTop:t.scrollY}}function H(t){if(X(t)==="html")return t;const e=t.assignedSlot||t.parentNode||Ct(t)&&t.host||E(t);return Ct(e)?e.host:e}function Ft(t){const e=H(t);return U(e)?t.ownerDocument?t.ownerDocument.body:t.body:D(e)&&tt(e)?e:Ft(e)}function Z(t,e,n){var o;e===void 0&&(e=[]),n===void 0&&(n=!0);const i=Ft(t),r=i===((o=t.ownerDocument)==null?void 0:o.body),s=A(i);if(r){const c=dt(s);return e.concat(s,s.visualViewport||[],tt(i)?i:[],c&&n?Z(c):[])}return e.concat(i,Z(i,[],n))}function dt(t){return t.parent&&Object.getPrototypeOf(t.parent)?t.frameElement:null}function Mt(t){const e=C(t);let n=parseFloat(e.width)||0,o=parseFloat(e.height)||0;const i=D(t),r=i?t.offsetWidth:n,s=i?t.offsetHeight:o,c=nt(n)!==r||nt(o)!==s;return c&&(n=r,o=s),{width:n,height:o,$:c}}function wt(t){return R(t)?t:t.contextElement}function z(t){const e=wt(t);if(!D(e))return S(1);const n=e.getBoundingClientRect(),{width:o,height:i,$:r}=Mt(e);let s=(r?nt(n.width):n.width)/o,c=(r?nt(n.height):n.height)/i;return(!s||!Number.isFinite(s))&&(s=1),(!c||!Number.isFinite(c))&&(c=1),{x:s,y:c}}const le=S(0);function Ht(t){const e=A(t);return!gt()||!e.visualViewport?le:{x:e.visualViewport.offsetLeft,y:e.visualViewport.offsetTop}}function fe(t,e,n){return e===void 0&&(e=!1),!n||e&&n!==A(t)?!1:e}function $(t,e,n,o){e===void 0&&(e=!1),n===void 0&&(n=!1);const i=t.getBoundingClientRect(),r=wt(t);let s=S(1);e&&(o?R(o)&&(s=z(o)):s=z(t));const c=fe(r,n,o)?Ht(r):S(0);let f=(i.left+c.x)/s.x,l=(i.top+c.y)/s.y,d=i.width/s.x,u=i.height/s.y;if(r){const m=A(r),a=o&&R(o)?A(o):o;let h=m,p=dt(h);for(;p&&o&&a!==h;){const w=z(p),g=p.getBoundingClientRect(),x=C(p),y=g.left+(p.clientLeft+parseFloat(x.paddingLeft))*w.x,b=g.top+(p.clientTop+parseFloat(x.paddingTop))*w.y;f*=w.x,l*=w.y,d*=w.x,u*=w.y,f+=y,l+=b,h=A(p),p=dt(h)}}return it({width:d,height:u,x:f,y:l})}function xt(t,e){const n=lt(t).scrollLeft;return e?e.left+n:$(E(t)).left+n}function Bt(t,e,n){n===void 0&&(n=!1);const o=t.getBoundingClientRect(),i=o.left+e.scrollLeft-(n?0:xt(t,o)),r=o.top+e.scrollTop;return{x:i,y:r}}function ae(t){let{elements:e,rect:n,offsetParent:o,strategy:i}=t;const r=i==="fixed",s=E(o),c=e?ct(e.floating):!1;if(o===s||c&&r)return n;let f={scrollLeft:0,scrollTop:0},l=S(1);const d=S(0),u=D(o);if((u||!u&&!r)&&((X(o)!=="body"||tt(s))&&(f=lt(o)),D(o))){const a=$(o);l=z(o),d.x=a.x+o.clientLeft,d.y=a.y+o.clientTop}const m=s&&!u&&!r?Bt(s,f,!0):S(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-f.scrollLeft*l.x+d.x+m.x,y:n.y*l.y-f.scrollTop*l.y+d.y+m.y}}function ue(t){return Array.from(t.getClientRects())}function de(t){const e=E(t),n=lt(t),o=t.ownerDocument.body,i=W(e.scrollWidth,e.clientWidth,o.scrollWidth,o.clientWidth),r=W(e.scrollHeight,e.clientHeight,o.scrollHeight,o.clientHeight);let s=-n.scrollLeft+xt(t);const c=-n.scrollTop;return C(o).direction==="rtl"&&(s+=W(e.clientWidth,o.clientWidth)-i),{width:i,height:r,x:s,y:c}}function me(t,e){const n=A(t),o=E(t),i=n.visualViewport;let r=o.clientWidth,s=o.clientHeight,c=0,f=0;if(i){r=i.width,s=i.height;const l=gt();(!l||l&&e==="fixed")&&(c=i.offsetLeft,f=i.offsetTop)}return{width:r,height:s,x:c,y:f}}function he(t,e){const n=$(t,!0,e==="fixed"),o=n.top+t.clientTop,i=n.left+t.clientLeft,r=D(t)?z(t):S(1),s=t.clientWidth*r.x,c=t.clientHeight*r.y,f=i*r.x,l=o*r.y;return{width:s,height:c,x:f,y:l}}function Tt(t,e,n){let o;if(e==="viewport")o=me(t,n);else if(e==="document")o=de(E(t));else if(R(e))o=he(e,n);else{const i=Ht(t);o={x:e.x-i.x,y:e.y-i.y,width:e.width,height:e.height}}return it(o)}function Nt(t,e){const n=H(t);return n===e||!R(n)||U(n)?!1:C(n).position==="fixed"||Nt(n,e)}function pe(t,e){const n=e.get(t);if(n)return n;let o=Z(t,[],!1).filter(c=>R(c)&&X(c)!=="body"),i=null;const r=C(t).position==="fixed";let s=r?H(t):t;for(;R(s)&&!U(s);){const c=C(s),f=pt(s);!f&&c.position==="fixed"&&(i=null),(r?!f&&!i:!f&&c.position==="static"&&!!i&&["absolute","fixed"].includes(i.position)||tt(s)&&!f&&Nt(t,s))?o=o.filter(d=>d!==s):i=c,s=H(s)}return e.set(t,o),o}function ge(t){let{element:e,boundary:n,rootBoundary:o,strategy:i}=t;const s=[...n==="clippingAncestors"?ct(e)?[]:pe(e,this._c):[].concat(n),o],c=s[0],f=s.reduce((l,d)=>{const u=Tt(e,d,i);return l.top=W(u.top,l.top),l.right=I(u.right,l.right),l.bottom=I(u.bottom,l.bottom),l.left=W(u.left,l.left),l},Tt(e,c,i));return{width:f.right-f.left,height:f.bottom-f.top,x:f.left,y:f.top}}function we(t){const{width:e,height:n}=Mt(t);return{width:e,height:n}}function xe(t,e,n){const o=D(e),i=E(e),r=n==="fixed",s=$(t,!0,r,e);let c={scrollLeft:0,scrollTop:0};const f=S(0);if(o||!o&&!r)if((X(e)!=="body"||tt(i))&&(c=lt(e)),o){const m=$(e,!0,r,e);f.x=m.x+e.clientLeft,f.y=m.y+e.clientTop}else i&&(f.x=xt(i));const l=i&&!o&&!r?Bt(i,c):S(0),d=s.left+c.scrollLeft-f.x-l.x,u=s.top+c.scrollTop-f.y-l.y;return{x:d,y:u,width:s.width,height:s.height}}function ft(t){return C(t).position==="static"}function Lt(t,e){if(!D(t)||C(t).position==="fixed")return null;if(e)return e(t);let n=t.offsetParent;return E(t)===n&&(n=n.ownerDocument.body),n}function Vt(t,e){const n=A(t);if(ct(t))return n;if(!D(t)){let i=H(t);for(;i&&!U(i);){if(R(i)&&!ft(i))return i;i=H(i)}return n}let o=Lt(t,e);for(;o&&re(o)&&ft(o);)o=Lt(o,e);return o&&U(o)&&ft(o)&&!pt(o)?n:o||ce(t)||n}const ye=async function(t){const e=this.getOffsetParent||Vt,n=this.getDimensions,o=await n(t.floating);return{reference:xe(t.reference,await e(t.floating),t.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function ve(t){return C(t).direction==="rtl"}const be={convertOffsetParentRelativeRectToViewportRelativeRect:ae,getDocumentElement:E,getClippingRect:ge,getOffsetParent:Vt,getElementRects:ye,getClientRects:ue,getDimensions:we,getScale:z,isElement:R,isRTL:ve};function Oe(t,e){let n=null,o;const i=E(t);function r(){var c;clearTimeout(o),(c=n)==null||c.disconnect(),n=null}function s(c,f){c===void 0&&(c=!1),f===void 0&&(f=1),r();const{left:l,top:d,width:u,height:m}=t.getBoundingClientRect();if(c||e(),!u||!m)return;const a=et(d),h=et(i.clientWidth-(l+u)),p=et(i.clientHeight-(d+m)),w=et(l),x={rootMargin:-a+"px "+-h+"px "+-p+"px "+-w+"px",threshold:W(0,I(1,f))||1};let y=!0;function b(v){const T=v[0].intersectionRatio;if(T!==f){if(!y)return s();T?s(!1,T):o=setTimeout(()=>{s(!1,1e-7)},1e3)}y=!1}try{n=new IntersectionObserver(b,{...x,root:i.ownerDocument})}catch{n=new IntersectionObserver(b,x)}n.observe(t)}return s(!0),r}function Ae(t,e,n,o){o===void 0&&(o={});const{ancestorScroll:i=!0,ancestorResize:r=!0,elementResize:s=typeof ResizeObserver=="function",layoutShift:c=typeof IntersectionObserver=="function",animationFrame:f=!1}=o,l=wt(t),d=i||r?[...l?Z(l):[],...Z(e)]:[];d.forEach(g=>{i&&g.addEventListener("scroll",n,{passive:!0}),r&&g.addEventListener("resize",n)});const u=l&&c?Oe(l,n):null;let m=-1,a=null;s&&(a=new ResizeObserver(g=>{let[x]=g;x&&x.target===l&&a&&(a.unobserve(e),cancelAnimationFrame(m),m=requestAnimationFrame(()=>{var y;(y=a)==null||y.observe(e)})),n()}),l&&!f&&a.observe(l),a.observe(e));let h,p=f?$(t):null;f&&w();function w(){const g=$(t);p&&(g.x!==p.x||g.y!==p.y||g.width!==p.width||g.height!==p.height)&&n(),p=g,h=requestAnimationFrame(w)}return n(),()=>{var g;d.forEach(x=>{i&&x.removeEventListener("scroll",n),r&&x.removeEventListener("resize",n)}),u?.(),(g=a)==null||g.disconnect(),a=null,f&&cancelAnimationFrame(h)}}const Re=ie,Ce=se,Te=ee,St=ne,ke=te,Le=(t,e,n)=>{const o=new Map,i={platform:be,...n},r={...i.platform,_c:o};return Qt(t,e,{...i,platform:r})};function Se(){return{name:"metadata",fn:t=>({data:t})}}const Wt=Dt((t,[e],{strategy:n="fixed",offsetOptions:o=0,placement:i="bottom",flipOptions:r,shiftOptions:s,middleware:c=[],setData:f})=>{const l=typeof e=="string"?document.querySelector(e):e;Object.assign(t.style,{position:n,top:"0",left:"0"});let d=async()=>{let{middlewareData:m,x:a,y:h}=await Le(l,t,{middleware:[Re(o),Te(r),Ce(s),...c,St({strategy:"referenceHidden"}),St({strategy:"escaped"}),Se()],placement:i,strategy:n}),p=m.hide?.referenceHidden;Object.assign(t.style,{top:`${h}px`,left:`${a}px`,margin:0,visibility:p?"hidden":"visible"}),f?.(m.metadata)};return d(),Ae(l,t,d)}),De=Dt((t,e)=>{let n=e[0];n(t)});class Ee extends $t{static{yt(this.prototype,"reference",[vt],function(){})}#t=(bt(this,"reference"),void 0);static{yt(this.prototype,"data",[vt],function(){})}#e=(bt(this,"data"),void 0);setData=e=>this.data=e;setReference=e=>{this.reference=e};static{jt(zt({id:"mbJdZwgK",block:'[[[1,"\\n"],[44,[[50,[32,0],2,null,[["flipOptions","hideOptions","middleware","offsetOptions","placement","shiftOptions","strategy","setData"],[[30,1],[30,2],[30,3],[30,4],[30,5],[30,6],[30,7],[30,0,["setData"]]]]]],[[[44,[[52,[30,0,["reference"]],[50,[30,8],2,[[30,0,["reference"]]],null]]],[[[1,"        "],[18,10,[[50,[32,1],2,[[30,0,["setReference"]]],null],[30,9],[28,[32,2],null,[["setReference","data"],[[30,0,["setReference"]],[30,0,["data"]]]]]]],[1,"\\n"]],[9]]]],[8]]],[1,"  "]],["@flipOptions","@hideOptions","@middleware","@offsetOptions","@placement","@shiftOptions","@strategy","prewiredAnchorTo","floating","&default"],false,["let","modifier","if","yield"]]',moduleName:"/home/runner/work/ember-native/ember-native/node_modules/.pnpm/ember-primitives@0.25.0_4moh5ufry33m6w3iy6itkpdste/node_modules/ember-primitives/dist/floating-ui/component.js",scope:()=>[Wt,De,It],isStrictMode:!0}),this)}}const Fe=Object.freeze(Object.defineProperty({__proto__:null,FloatingUI:Ee,anchorTo:Wt},Symbol.toStringTag,{value:"Module"}));export{Ee as F,ke as a,Fe as f};
