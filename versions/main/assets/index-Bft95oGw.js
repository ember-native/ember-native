import{au as U,av as ie}from"./main-BqZkAFwI.js";/*!
* tabbable 5.3.3
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/var Z=["input","select","textarea","a[href]","button","[tabindex]:not(slot)","audio[controls]","video[controls]",'[contenteditable]:not([contenteditable="false"])',"details>summary:first-of-type","details"],C=Z.join(","),Q=typeof Element>"u",F=Q?function(){}:Element.prototype.matches||Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector,L=!Q&&Element.prototype.getRootNode?function(a){return a.getRootNode()}:function(a){return a.ownerDocument},X=function(e,t,r){var n=Array.prototype.slice.apply(e.querySelectorAll(C));return t&&F.call(e,C)&&n.unshift(e),n=n.filter(r),n},J=function a(e,t,r){for(var n=[],o=Array.from(e);o.length;){var c=o.shift();if(c.tagName==="SLOT"){var f=c.assignedElements(),b=f.length?f:c.children,h=a(b,!0,r);r.flatten?n.push.apply(n,h):n.push({scope:c,candidates:h})}else{var g=F.call(c,C);g&&r.filter(c)&&(t||!e.includes(c))&&n.push(c);var y=c.shadowRoot||typeof r.getShadowRoot=="function"&&r.getShadowRoot(c),w=!r.shadowRootFilter||r.shadowRootFilter(c);if(y&&w){var S=a(y===!0?c.children:y.children,!0,r);r.flatten?n.push.apply(n,S):n.push({scope:c,candidates:S})}else o.unshift.apply(o,c.children)}}return n},_=function(e,t){return e.tabIndex<0&&(t||/^(AUDIO|VIDEO|DETAILS)$/.test(e.tagName)||e.isContentEditable)&&isNaN(parseInt(e.getAttribute("tabindex"),10))?0:e.tabIndex},oe=function(e,t){return e.tabIndex===t.tabIndex?e.documentOrder-t.documentOrder:e.tabIndex-t.tabIndex},ee=function(e){return e.tagName==="INPUT"},ue=function(e){return ee(e)&&e.type==="hidden"},ce=function(e){var t=e.tagName==="DETAILS"&&Array.prototype.slice.apply(e.children).some(function(r){return r.tagName==="SUMMARY"});return t},se=function(e,t){for(var r=0;r<e.length;r++)if(e[r].checked&&e[r].form===t)return e[r]},fe=function(e){if(!e.name)return!0;var t=e.form||L(e),r=function(f){return t.querySelectorAll('input[type="radio"][name="'+f+'"]')},n;if(typeof window<"u"&&typeof window.CSS<"u"&&typeof window.CSS.escape=="function")n=r(window.CSS.escape(e.name));else try{n=r(e.name)}catch(c){return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s",c.message),!1}var o=se(n,e.form);return!o||o===e},le=function(e){return ee(e)&&e.type==="radio"},de=function(e){return le(e)&&!fe(e)},K=function(e){var t=e.getBoundingClientRect(),r=t.width,n=t.height;return r===0&&n===0},ve=function(e,t){var r=t.displayCheck,n=t.getShadowRoot;if(getComputedStyle(e).visibility==="hidden")return!0;var o=F.call(e,"details>summary:first-of-type"),c=o?e.parentElement:e;if(F.call(c,"details:not([open]) *"))return!0;var f=L(e).host,b=f?.ownerDocument.contains(f)||e.ownerDocument.contains(e);if(!r||r==="full"){if(typeof n=="function"){for(var h=e;e;){var g=e.parentElement,y=L(e);if(g&&!g.shadowRoot&&n(g)===!0)return K(e);e.assignedSlot?e=e.assignedSlot:!g&&y!==e.ownerDocument?e=y.host:e=g}e=h}if(b)return!e.getClientRects().length}else if(r==="non-zero-area")return K(e);return!1},be=function(e){if(/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.tagName))for(var t=e.parentElement;t;){if(t.tagName==="FIELDSET"&&t.disabled){for(var r=0;r<t.children.length;r++){var n=t.children.item(r);if(n.tagName==="LEGEND")return F.call(t,"fieldset[disabled] *")?!0:!n.contains(e)}return!0}t=t.parentElement}return!1},A=function(e,t){return!(t.disabled||ue(t)||ve(t,e)||ce(t)||be(t))},x=function(e,t){return!(de(t)||_(t)<0||!A(e,t))},pe=function(e){var t=parseInt(e.getAttribute("tabindex"),10);return!!(isNaN(t)||t>=0)},he=function a(e){var t=[],r=[];return e.forEach(function(n,o){var c=!!n.scope,f=c?n.scope:n,b=_(f,c),h=c?a(n.candidates):f;b===0?c?t.push.apply(t,h):t.push(f):r.push({documentOrder:o,tabIndex:b,item:n,isScope:c,content:h})}),r.sort(oe).reduce(function(n,o){return o.isScope?n.push.apply(n,o.content):n.push(o.content),n},[]).concat(t)},ge=function(e,t){t=t||{};var r;return t.getShadowRoot?r=J([e],t.includeContainer,{filter:x.bind(null,t),flatten:!1,getShadowRoot:t.getShadowRoot,shadowRootFilter:pe}):r=X(e,t.includeContainer,x.bind(null,t)),he(r)},ye=function(e,t){t=t||{};var r;return t.getShadowRoot?r=J([e],t.includeContainer,{filter:A.bind(null,t),flatten:!0,getShadowRoot:t.getShadowRoot}):r=X(e,t.includeContainer,A.bind(null,t)),r},D=function(e,t){if(t=t||{},!e)throw new Error("No node provided");return F.call(e,C)===!1?!1:x(t,e)},Te=Z.concat("iframe").join(","),P=function(e,t){if(t=t||{},!e)throw new Error("No node provided");return F.call(e,Te)===!1?!1:A(t,e)};/*!
* focus-trap 6.9.4
* @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
*/function $(a,e){var t=Object.keys(a);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(a);e&&(r=r.filter(function(n){return Object.getOwnPropertyDescriptor(a,n).enumerable})),t.push.apply(t,r)}return t}function V(a){for(var e=1;e<arguments.length;e++){var t=arguments[e]!=null?arguments[e]:{};e%2?$(Object(t),!0).forEach(function(r){me(a,r,t[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(a,Object.getOwnPropertyDescriptors(t)):$(Object(t)).forEach(function(r){Object.defineProperty(a,r,Object.getOwnPropertyDescriptor(t,r))})}return a}function me(a,e,t){return e in a?Object.defineProperty(a,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):a[e]=t,a}var z=function(){var a=[];return{activateTrap:function(t){if(a.length>0){var r=a[a.length-1];r!==t&&r.pause()}var n=a.indexOf(t);n===-1||a.splice(n,1),a.push(t)},deactivateTrap:function(t){var r=a.indexOf(t);r!==-1&&a.splice(r,1),a.length>0&&a[a.length-1].unpause()}}}(),we=function(e){return e.tagName&&e.tagName.toLowerCase()==="input"&&typeof e.select=="function"},Fe=function(e){return e.key==="Escape"||e.key==="Esc"||e.keyCode===27},Se=function(e){return e.key==="Tab"||e.keyCode===9},Y=function(e){return setTimeout(e,0)},W=function(e,t){var r=-1;return e.every(function(n,o){return t(n)?(r=o,!1):!0}),r},N=function(e){for(var t=arguments.length,r=new Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];return typeof e=="function"?e.apply(void 0,r):e},R=function(e){return e.target.shadowRoot&&typeof e.composedPath=="function"?e.composedPath()[0]:e.target},Oe=function(e,t){var r=t?.document||document,n=V({returnFocusOnDeactivate:!0,escapeDeactivates:!0,delayInitialFocus:!0},t),o={containers:[],containerGroups:[],tabbableGroups:[],nodeFocusedBeforeActivation:null,mostRecentlyFocusedNode:null,active:!1,paused:!1,delayInitialFocusTimer:void 0},c,f=function(i,u,s){return i&&i[u]!==void 0?i[u]:n[s||u]},b=function(i){return o.containerGroups.findIndex(function(u){var s=u.container,v=u.tabbableNodes;return s.contains(i)||v.find(function(l){return l===i})})},h=function(i){var u=n[i];if(typeof u=="function"){for(var s=arguments.length,v=new Array(s>1?s-1:0),l=1;l<s;l++)v[l-1]=arguments[l];u=u.apply(void 0,v)}if(u===!0&&(u=void 0),!u){if(u===void 0||u===!1)return u;throw new Error("`".concat(i,"` was specified but was not a node, or did not return a node"))}var p=u;if(typeof u=="string"&&(p=r.querySelector(u),!p))throw new Error("`".concat(i,"` as selector refers to no known node"));return p},g=function(){var i=h("initialFocus");if(i===!1)return!1;if(i===void 0)if(b(r.activeElement)>=0)i=r.activeElement;else{var u=o.tabbableGroups[0],s=u&&u.firstTabbableNode;i=s||h("fallbackFocus")}if(!i)throw new Error("Your focus-trap needs to have at least one focusable element");return i},y=function(){if(o.containerGroups=o.containers.map(function(i){var u=ge(i,n.tabbableOptions),s=ye(i,n.tabbableOptions);return{container:i,tabbableNodes:u,focusableNodes:s,firstTabbableNode:u.length>0?u[0]:null,lastTabbableNode:u.length>0?u[u.length-1]:null,nextTabbableNode:function(l){var p=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!0,T=s.findIndex(function(m){return m===l});if(!(T<0))return p?s.slice(T+1).find(function(m){return D(m,n.tabbableOptions)}):s.slice(0,T).reverse().find(function(m){return D(m,n.tabbableOptions)})}}}),o.tabbableGroups=o.containerGroups.filter(function(i){return i.tabbableNodes.length>0}),o.tabbableGroups.length<=0&&!h("fallbackFocus"))throw new Error("Your focus-trap must have at least one container with at least one tabbable node in it at all times")},w=function d(i){if(i!==!1&&i!==r.activeElement){if(!i||!i.focus){d(g());return}i.focus({preventScroll:!!n.preventScroll}),o.mostRecentlyFocusedNode=i,we(i)&&i.select()}},S=function(i){var u=h("setReturnFocus",i);return u||(u===!1?!1:i)},E=function(i){var u=R(i);if(!(b(u)>=0)){if(N(n.clickOutsideDeactivates,i)){c.deactivate({returnFocus:n.returnFocusOnDeactivate&&!P(u,n.tabbableOptions)});return}N(n.allowOutsideClick,i)||i.preventDefault()}},j=function(i){var u=R(i),s=b(u)>=0;s||u instanceof Document?s&&(o.mostRecentlyFocusedNode=u):(i.stopImmediatePropagation(),w(o.mostRecentlyFocusedNode||g()))},ae=function(i){var u=R(i);y();var s=null;if(o.tabbableGroups.length>0){var v=b(u),l=v>=0?o.containerGroups[v]:void 0;if(v<0)i.shiftKey?s=o.tabbableGroups[o.tabbableGroups.length-1].lastTabbableNode:s=o.tabbableGroups[0].firstTabbableNode;else if(i.shiftKey){var p=W(o.tabbableGroups,function(k){var I=k.firstTabbableNode;return u===I});if(p<0&&(l.container===u||P(u,n.tabbableOptions)&&!D(u,n.tabbableOptions)&&!l.nextTabbableNode(u,!1))&&(p=v),p>=0){var T=p===0?o.tabbableGroups.length-1:p-1,m=o.tabbableGroups[T];s=m.lastTabbableNode}}else{var O=W(o.tabbableGroups,function(k){var I=k.lastTabbableNode;return u===I});if(O<0&&(l.container===u||P(u,n.tabbableOptions)&&!D(u,n.tabbableOptions)&&!l.nextTabbableNode(u))&&(O=v),O>=0){var re=O===o.tabbableGroups.length-1?0:O+1,ne=o.tabbableGroups[re];s=ne.firstTabbableNode}}}else s=h("fallbackFocus");s&&(i.preventDefault(),w(s))},B=function(i){if(Fe(i)&&N(n.escapeDeactivates,i)!==!1){i.preventDefault(),c.deactivate();return}if(Se(i)){ae(i);return}},G=function(i){var u=R(i);b(u)>=0||N(n.clickOutsideDeactivates,i)||N(n.allowOutsideClick,i)||(i.preventDefault(),i.stopImmediatePropagation())},H=function(){if(o.active)return z.activateTrap(c),o.delayInitialFocusTimer=n.delayInitialFocus?Y(function(){w(g())}):w(g()),r.addEventListener("focusin",j,!0),r.addEventListener("mousedown",E,{capture:!0,passive:!1}),r.addEventListener("touchstart",E,{capture:!0,passive:!1}),r.addEventListener("click",G,{capture:!0,passive:!1}),r.addEventListener("keydown",B,{capture:!0,passive:!1}),c},q=function(){if(o.active)return r.removeEventListener("focusin",j,!0),r.removeEventListener("mousedown",E,!0),r.removeEventListener("touchstart",E,!0),r.removeEventListener("click",G,!0),r.removeEventListener("keydown",B,!0),c};return c={get active(){return o.active},get paused(){return o.paused},activate:function(i){if(o.active)return this;var u=f(i,"onActivate"),s=f(i,"onPostActivate"),v=f(i,"checkCanFocusTrap");v||y(),o.active=!0,o.paused=!1,o.nodeFocusedBeforeActivation=r.activeElement,u&&u();var l=function(){v&&y(),H(),s&&s()};return v?(v(o.containers.concat()).then(l,l),this):(l(),this)},deactivate:function(i){if(!o.active)return this;var u=V({onDeactivate:n.onDeactivate,onPostDeactivate:n.onPostDeactivate,checkCanReturnFocus:n.checkCanReturnFocus},i);clearTimeout(o.delayInitialFocusTimer),o.delayInitialFocusTimer=void 0,q(),o.active=!1,o.paused=!1,z.deactivateTrap(c);var s=f(u,"onDeactivate"),v=f(u,"onPostDeactivate"),l=f(u,"checkCanReturnFocus"),p=f(u,"returnFocus","returnFocusOnDeactivate");s&&s();var T=function(){Y(function(){p&&w(S(o.nodeFocusedBeforeActivation)),v&&v()})};return p&&l?(l(S(o.nodeFocusedBeforeActivation)).then(T,T),this):(T(),this)},pause:function(){return o.paused||!o.active?this:(o.paused=!0,q(),this)},unpause:function(){return!o.paused||!o.active?this:(o.paused=!1,y(),H(),this)},updateContainerElements:function(i){var u=[].concat(i).filter(Boolean);return o.containers=u.map(function(s){return typeof s=="string"?r.querySelector(s):s}),o.active&&y(),this}},c.updateContainerElements(e),c};let M;try{M=U("3.22")}catch{M=U()}var te=ie(()=>({capabilities:M,createModifier(){return{focusTrapOptions:void 0,isActive:!0,isPaused:!1,shouldSelfFocus:!1,focusTrap:void 0}},installModifier(a,e,{named:{isActive:t,isPaused:r,shouldSelfFocus:n,focusTrapOptions:o,additionalElements:c,_createFocusTrap:f}}){a.focusTrapOptions={...o},typeof t<"u"&&(a.isActive=t),typeof r<"u"&&(a.isPaused=r),a.focusTrapOptions&&typeof a.focusTrapOptions.initialFocus>"u"&&n&&(a.focusTrapOptions.initialFocus=e);let b=Oe;f&&(b=f),a.focusTrapOptions.returnFocusOnDeactivate!==!1&&(a.focusTrapOptions.returnFocusOnDeactivate=!0),a.focusTrap=b(typeof c<"u"?[e,...c]:e,a.focusTrapOptions),a.isActive&&a.focusTrap.activate(),a.isPaused&&a.focusTrap.pause()},updateModifier(a,{named:e}){const t=e.focusTrapOptions||{};if(a.isActive&&!e.isActive){const{returnFocusOnDeactivate:r}=t,n=typeof r>"u";a.focusTrap.deactivate({returnFocus:n})}else!a.isActive&&e.isActive&&a.focusTrap.activate();a.isPaused&&!e.isPaused?a.focusTrap.unpause():!a.isPaused&&e.isPaused&&a.focusTrap.pause(),a.focusTrapOptions=t,typeof e.isActive<"u"&&(a.isActive=e.isActive),typeof e.isPaused<"u"&&(a.isPaused=e.isPaused)},destroyModifier({focusTrap:a}){a.deactivate()}}),class{});const De=Object.freeze(Object.defineProperty({__proto__:null,default:te},Symbol.toStringTag,{value:"Module"})),Re=Object.freeze(Object.defineProperty({__proto__:null,focusTrap:te},Symbol.toStringTag,{value:"Module"}));export{De as f,Re as i};
