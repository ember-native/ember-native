import { DOMDomainDebugger } from '@nativescript/core/debugger/webinspector-dom';
import * as inspectorCommands from '@nativescript/core/debugger/InspectorBackendCommands';
import { RSVP } from '@ember/-internals/runtime';
import Ember from 'ember';
import * as tracking from '@glimmer/tracking';
import * as runtime from '@glimmer/runtime';
import * as validator from '@glimmer/validator';
import * as reference from '@glimmer/reference';
import * as runloop from '@ember/runloop';
import ElementNode from './dom/nodes/ElementNode';
import { CSSDomainDebugger } from '@nativescript/core/debugger/webinspector-css';

export function setupInspectorSupport(config: any) {
  window.define('@glimmer/tracking', () => tracking);
  window.define('@glimmer/runtime', () => runtime);
  window.define('@glimmer/validator', () => validator);
  window.define('@glimmer/reference', () => reference);
  window.define('@ember/runloop', () => runloop);

  window.define('rsvp', () => RSVP);
  window.define('ember', () => ({ default: Ember }));
  window.define('doc-app/config/environment', () => ({
    default: config,
  }));

  console.debug = console.log;

  const globalMessaging: Record<string, Function[]> = {};

  class Event {
    target: any;
    type: any;

    constructor(type: string, target: Element) {
      this.type = type;
      this.target = target;
    }

    preventDefault() {

    }
    stopPropagation() {

    }
  }

  globalThis.postMessage = (msg, origin, ports?: Transferable[]) => {
    globalMessaging['message']?.forEach((listener) => listener({
      data: msg,
      origin,
      ports
    }));
  }

  globalThis.triggerEvent = (type: string, element: Element, data: any) => {
    const e = new Event(type, element);
    globalMessaging[type]?.forEach((cb) => {
      cb(e);
    })
  }

  globalThis.addEventListener = (type: any, cb: any) => {
    globalMessaging[type] = globalMessaging[type] || [];
    globalMessaging[type]!.push(cb);
  }

  globalThis.removeEventListener = (type: any, cb: any) => {
    if (type === 'message') {
      const i = globalMessaging[type]?.indexOf(cb) || -1;
      if (i >= 0) {
        globalMessaging[type]!.splice(i, 1);
      }
    }
  }

  if (document.documentElement && document.documentElement.dataset) {
    // let EmberDebug know that content script has executed
    document.documentElement.dataset['emberExtension'] = "1";
  }

  class Port {
    private msgId: number;
    listeners: any[];
    private otherPort: keyof MessageChannel;
    private channel: MessageChannel;
    constructor(channel: MessageChannel, otherPort: keyof MessageChannel) {
      this.channel = channel;
      this.otherPort = otherPort;
      this.msgId = 20000;
      this.listeners = [];
    }

    trigger(msg: any) {
      this.listeners.forEach((listener) => listener({ data: msg }));
    }

    get channelPort() {
      return this.channel[this.otherPort];
    }

    start() {

    }
    addEventListener(type: string, cb: Function) {
      this.listeners.push(cb);
    }
    postMessage(msg: any) {
      this.channelPort.trigger(msg);
    }
  }

  class MessageChannel {
    port1 = new Port(this, 'port2');
    port2 = new Port(this, 'port1');
  }

  (globalThis as any).MessageChannel = MessageChannel;

  globalThis.scrollX = 0;
  globalThis.scrollY = 0;
  Object.defineProperty(globalThis as any, 'innerWidth', {
    get() {
      return (document.body as any)?.nativeView?.getActualSize().width || 0;
    }
  })


  (CSSDomainDebugger.prototype as any).getInlineStylesForNode = (params: any) => {
    const n = document.nodeMap.get(params.nodeId) as ElementNode;
    return {
      attributesStyle: {
        CSSStyle: {
          cssProperties: [],
          shorthandEntries: []
        }
      },
      inlineStyle: {
        shorthandEntries: [],
        cssProperties: Object.entries(n.style).map(([k, v]) => ({
          name: k,
          value: String(v)
        }))
      }
    }
  }


  DOMDomainDebugger.prototype.resolveNode = ((params) => {
    const n = document.nodeMap.get(params.nodeId);
    console.log(n);

    return {
      object: {
        type: 'object',
        className: n.constructor.name,
        value: n,
        objectId: 'dont know'
      }
    };
  });


  let EmberDomain = class EmberDomain {
    port!: MessagePort;
    private msgId: number;
    constructor() {
      this.msgId = 0;
      globalThis.addEventListener('message', (msg) => {
        if (msg.data === 'debugger-client') {
          this.port = msg.ports[0]!;
          this.port.addEventListener('message', (msg) => {
            __inspectorSendEvent(JSON.stringify({
              id: this.msgId++,
              method: 'Ember.toExtension',
              params: msg,
            }));
          })
        }
      })
    }
    fromExtension(msg: any) {
      try {
        if (msg.type) {
          this.port?.postMessage(msg);
        }
      } catch (e) {
        console.error(e);
      }

      if (msg.type === 'inject-code' && !globalThis.emberDebugInjected) {
        globalThis.emberDebugInjected = true;
        try {
          eval(msg.value);
        } catch(e) {
          console.error(e)
        }
      }
    }
  }

  EmberDomain = __decorate([
    inspectorCommands.DomainDispatcher('Ember'),
    __metadata("design:paramtypes", [])
  ], EmberDomain);
}

