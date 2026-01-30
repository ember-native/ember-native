
import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-ClPBvGFm.js';
import { createElement } from '../element-registry.js';
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
  querySelectorAll(selector) {
    if (selector.startsWith('meta')) {
      const config = this.config;
      return {
        getAttribute() {
          return JSON.stringify(config);
        }
      };
    }
  }
}

export { DocumentNode as default };
//# sourceMappingURL=DocumentNode.js.map
