import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-apNPIsxw.js';
import { isKnownView, createElement, normalizeElementName } from '../element-registry.js';
import CommentNode from './CommentNode.js';
import ElementNode from './ElementNode.js';
import PropertyNode from './PropertyNode.js';
import TextNode from './TextNode.js';
import ViewNode from './ViewNode.js';
import NativeElementNode from '../native/NativeElementNode.js';

function* elementIterator(el) {
  yield el;
  for (const child of el.childNodes) {
    yield* elementIterator(child);
  }
}
class HeadNode extends ElementNode {
  constructor(tagName, document) {
    super(tagName);
    _defineProperty(this, "document", void 0);
    this.document = document;
  }
  appendChild(childNode) {
    if (childNode.tagName === 'style') {
      this.document.page.nativeView.addCss(childNode.childNodes[0].text);
      return;
    }
    super.appendChild(childNode);
  }
}
let document = null;
class DocumentNode extends ViewNode {
  static getInstance() {
    if (!document) {
      document = new DocumentNode();
    }
    return document;
  }
  constructor() {
    if (document) return document;
    super();
    _defineProperty(this, "head", void 0);
    _defineProperty(this, "config", void 0);
    _defineProperty(this, "page", void 0);
    _defineProperty(this, "body", void 0);
    _defineProperty(this, "documentElement", {
      dataset: {}
    });
    // There's no async page-loading phase in a native app - the "document" is available
    // immediately, unlike a browser's parse-then-load sequence. QUnit checks this before
    // registering a `window` `load` listener to autostart: without it fixed at `'complete'`,
    // it waits for a `load` event that a native app never fires, and tests never start.
    _defineProperty(this, "readyState", 'complete');
    document = this;
    this.tagName = 'docNode';
    this.nodeType = 9;
    this.head = new HeadNode('head', this);
    this.appendChild(this.head);
    this.nodeMap = new Map();
  }
  createEvent(eventInterface) {
    const event = {
      eventInterface,
      initEvent(type, bubbles, cancelable) {
        Object.assign(event, {
          type,
          bubbles,
          cancelable
        });
      }
    };
    return event;
  }
  createComment(text) {
    return new CommentNode(text);
  }
  static createPropertyNode(tagName) {
    return new PropertyNode(tagName);
  }
  createElement(name) {
    return DocumentNode.createElement(name);
  }
  static createElement(tagName) {
    if (tagName === 'property') {
      return this.createPropertyNode(tagName);
    }
    if (!isKnownView(tagName)) {
      // Browser-only tags (`meta`, `link`, `title`, ...) have no native
      // NativeScript counterpart and were never meant to be rendered - but
      // Vite's own runtime (the `__vitePreload` module-preload helper, run
      // for every dynamic import) creates/queries them unconditionally, the
      // same way it would against a real browser `document`. Throwing here
      // crashed that generic code path; an inert element that just
      // participates harmlessly in the tree (no native view, never
      // rendered) is enough to satisfy it.
      const e = new ElementNode(tagName);
      e._ownerDocument = this.getInstance();
      return e;
    }
    const e = createElement(tagName);
    e._ownerDocument = this.getInstance();
    if (e instanceof NativeElementNode && e.nativeView) {
      this.getInstance().nodeMap.set(e.nativeView._domId, e);
    }
    if (tagName === 'page') {
      this.getInstance().page = e;
      Object.defineProperty(this.getInstance(), 'body', {
        configurable: true,
        get() {
          const page = this.page;
          return {
            insertAdjacentHTML() {
              return null;
            },
            addEventListener: globalThis.addEventListener.bind(page),
            get lastChild() {
              return null;
            }
          };
        }
      });
    }
    return e;
  }
  createElementNS(_namespace, tagName) {
    return DocumentNode.createElement(tagName);
  }
  createTextNode(text) {
    return new TextNode(text);
  }
  addEventListener(event, callback) {
    if (event === 'DOMContentLoaded') {
      setTimeout(callback, 0);
      return;
    }
    console.error('unsupported event on document', event);
  }
  removeEventListener(event, handler) {
    if (event === 'DOMContentLoaded') {
      return;
    }
    console.error('unsupported event on document', event, handler);
  }
  searchDom(node, startNode, endNode) {
    const start = startNode || this.page;
    if (start === node) {
      return true;
    }
    if (node === endNode) {
      return false;
    }
    for (const childNode of start.childNodes) {
      if (this.searchDom(node, childNode, endNode)) {
        return true;
      }
    }
    let sibling = node;
    while (sibling) {
      if (this.searchDom(node, sibling, endNode)) {
        return true;
      }
      sibling = sibling.nextSibling;
    }
    return false;
  }
  createRange() {
    const self = this;
    return {
      startNode: null,
      endNode: null,
      setStartBefore(startNode) {
        while (startNode && !startNode.nativeView) {
          startNode = startNode.nextSibling;
        }
        this.startNode = startNode;
      },
      setEndAfter(endNode) {
        while (endNode && !endNode.nativeView) {
          endNode = endNode.prevSibling;
        }
        this.endNode = endNode;
      },
      isPointInRange(dom) {
        return self.searchDom(dom, this.startNode, this.endNode);
      },
      getBoundingClientRect() {
        if (!(this.startNode instanceof NativeElementNode)) return null;
        if (!this.startNode?.nativeView) return null;
        const point = this.startNode.nativeView.getLocationInWindow();
        const size = this.startNode.nativeView.getActualSize();
        let x = point.x;
        let y = point.y;
        let width = size.width;
        let height = size.height;
        for (const element of elementIterator(this.startNode)) {
          const point = element.nativeView.getLocationInWindow();
          const size = element.nativeView.getActualSize();
          x = Math.min(x, point.x);
          y = Math.min(y, point.y);
          width = point.x + size.width - x;
          height = point.y + size.height - y;
          if (element === this.endNode) {
            break;
          }
        }
        return {
          left: x,
          top: y,
          bottom: y + height,
          width,
          height
        };
      }
    };
  }

  // Fakes the single `<meta name=".../config/environment" content="...">`
  // tag `@embroider/config-meta-loader`/ember-cli's classic
  // `app-config-from-meta.js` read config from in a real browser DOM - there
  // is no such tag here (NativeScript has no HTML `<head>` to serialize one
  // into), so `setupEmberNativeApp` stashes the raw config object on
  // `this.config` instead (see `setup-app.ts`) and this fakes the lookup.
  // Matched by substring, not `selector.startsWith('meta')`: a broader match
  // would also swallow unrelated `meta[...]` lookups (e.g. Vite's own
  // `meta[property=csp-nonce]` probe in its module-preload runtime helper)
  // and hand back this app's entire config as a fake attribute value instead
  // of correctly reporting "no such element".
  querySelectorAll(selector) {
    if (selector.includes('config/environment')) {
      const config = this.config;
      return {
        getAttribute() {
          return JSON.stringify(config);
        }
      };
    }
  }

  // Overrides `ViewNode#querySelector` only for the `meta` pseudo-element
  // faked by `querySelectorAll` above - needed because the real caller
  // (`@embroider/config-meta-loader`/ember-cli's classic config loading)
  // uses the singular `querySelector`, not `querySelectorAll`. Everything
  // else (`#id`, `.class`, plain tag names - including
  // `@ember/test-helpers`' own `document.querySelector('#ember-testing')`,
  // and any other `meta[...]` lookup that isn't the config tag) falls
  // through to the real tree-walking implementation inherited from
  // `ViewNode`.
  querySelector(selector) {
    return this.querySelectorAll(selector) || super.querySelector(selector);
  }

  // Vite's runtime module-preload helper (run for every dynamic import, in
  // both dev and prod) calls `document.getElementsByTagName('link')`
  // unconditionally to dedupe already-injected preload links - unlike
  // `querySelector`/`querySelectorAll`, nothing on `ViewNode` provided a
  // plural, list-returning tag lookup (only the singular
  // `getElementByTagName`), so this always threw `TypeError:
  // document.getElementsByTagName is not a function`.
  getElementsByTagName(tagName) {
    const normalizedTagName = normalizeElementName(tagName);
    const results = [];
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.tagName === normalizedTagName) {
        results.push(el);
      }
    }
    return results;
  }
}

export { DocumentNode as default };
//# sourceMappingURL=DocumentNode.js.map
