import { createElement, isKnownView, normalizeElementName } from '../element-registry.ts';
import CommentNode from './CommentNode.ts';
import ElementNode from './ElementNode.ts';
import PropertyNode from './PropertyNode.ts';
import TextNode from './TextNode.ts';
import ViewNode from './ViewNode.ts';
import type { NativeElementsTagNameMap } from '../native-elements-tag-name-map.ts';
import type PageElement from '../native/PageElement.ts';
import NativeElementNode from '../native/NativeElementNode.ts';

function* elementIterator(el: any): Generator<any, void, unknown> {
  yield el;
  for (const child of el.childNodes) {
    yield* elementIterator(child);
  }
}

class HeadNode extends ElementNode {
  private document: any;
  constructor(tagName: string, document: DocumentNode) {
    super(tagName);
    this.document = document;
  }
  appendChild(childNode: ViewNode) {
    if (childNode.tagName === 'style') {
      this.document.page.nativeView.addCss(
        (childNode.childNodes[0]! as any).text,
      );
      return;
    }
    super.appendChild(childNode);
  }
}

let document: DocumentNode | null = null;

export default class DocumentNode extends ViewNode {
  head: any;
  config: any;
  declare nodeMap: Map<any, any>;
  page: PageElement | undefined;
  body: ElementNode | undefined;
  documentElement = {
    dataset: {},
  };
  // There's no async page-loading phase in a native app - the "document" is available
  // immediately, unlike a browser's parse-then-load sequence. QUnit checks this before
  // registering a `window` `load` listener to autostart: without it fixed at `'complete'`,
  // it waits for a `load` event that a native app never fires, and tests never start.
  readyState = 'complete';

  static getInstance() {
    if (!document) {
      document = new DocumentNode();
    }
    return document;
  }

  constructor() {
    if (document) return document;
    super();
    document = this;
    this.tagName = 'docNode';
    this.nodeType = 9;
    this.head = new HeadNode('head', this);
    this.appendChild(this.head);
    this.nodeMap = new Map();
  }

  createEvent(eventInterface: string) {
    const event = {
      eventInterface,
      initEvent(type: string, bubbles: boolean, cancelable: boolean) {
        Object.assign(event, {
          type,
          bubbles,
          cancelable,
        });
      },
    };
    return event;
  }

  createComment(text: string) {
    return new CommentNode(text);
  }

  static createPropertyNode(tagName: string): PropertyNode {
    return new PropertyNode(tagName);
  }

  createElement(name: string) {
    return DocumentNode.createElement(name as any);
  }

  static createElement<T extends keyof NativeElementsTagNameMap>(
    tagName: T,
  ): NativeElementsTagNameMap[T] {
    if (tagName === 'property') {
      return this.createPropertyNode(tagName) as any;
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
      const e = new ElementNode(tagName as string);
      e._ownerDocument = this.getInstance();
      return e as any;
    }
    const e = createElement(tagName);
    e._ownerDocument = this.getInstance();
    if (e instanceof NativeElementNode && e.nativeView) {
      this.getInstance().nodeMap.set(e.nativeView._domId, e);
    }
    if (tagName === 'page') {
      this.getInstance().page = e as PageElement;

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
            },
          };
        },
      });
    }
    return e;
  }

  createElementNS(_namespace: any, tagName: keyof NativeElementsTagNameMap) {
    return DocumentNode.createElement(tagName);
  }

  createTextNode(text: string) {
    return new TextNode(text);
  }

  addEventListener(event: string, callback: EventListener) {
    if (event === 'DOMContentLoaded') {
      setTimeout(callback, 0);
      return;
    }
    console.error('unsupported event on document', event);
  }

  removeEventListener(event: string, handler: EventListener) {
    if (event === 'DOMContentLoaded') {
      return;
    }
    console.error('unsupported event on document', event, handler);
  }

  searchDom(node: ViewNode, startNode: ViewNode, endNode: ViewNode) {
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
    let sibling: ViewNode | null = node;
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
      startNode: null as ViewNode | null,
      endNode: null as ViewNode | null,
      setStartBefore(startNode: ViewNode | null) {
        while (startNode && !(startNode as NativeElementNode).nativeView) {
          startNode = startNode.nextSibling;
        }
        this.startNode = startNode;
      },
      setEndAfter(endNode: ViewNode | null) {
        while (endNode && !(endNode as NativeElementNode).nativeView) {
          endNode = endNode.prevSibling;
        }
        this.endNode = endNode;
      },
      isPointInRange(dom: ViewNode): boolean {
        return self.searchDom(dom, this.startNode!, this.endNode!);
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
          height,
        };
      },
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
  querySelectorAll(selector: string) {
    if (selector.includes('config/environment')) {
      const config = this.config;
      return {
        getAttribute(): string {
          return JSON.stringify(config);
        },
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
  querySelector(selector: string) {
    return this.querySelectorAll(selector) || super.querySelector(selector);
  }

  // Vite's runtime module-preload helper (run for every dynamic import, in
  // both dev and prod) calls `document.getElementsByTagName('link')`
  // unconditionally to dedupe already-injected preload links - unlike
  // `querySelector`/`querySelectorAll`, nothing on `ViewNode` provided a
  // plural, list-returning tag lookup (only the singular
  // `getElementByTagName`), so this always threw `TypeError:
  // document.getElementsByTagName is not a function`.
  getElementsByTagName(tagName: string) {
    const normalizedTagName = normalizeElementName(tagName);
    const results: ViewNode[] = [];
    for (const el of elementIterator(this)) {
      if (el.nodeType === 1 && el.tagName === normalizedTagName) {
        results.push(el);
      }
    }
    return results;
  }
}
