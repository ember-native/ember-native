import { createElement } from '../element-registry.ts';
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

  querySelectorAll(selector: string) {
    if (selector.startsWith('meta')) {
      const config = this.config;
      return {
        getAttribute(): string {
          return JSON.stringify(config);
        },
      };
    }
  }
}
