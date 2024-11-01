import { DOMDomainDebugger } from '@nativescript/core/debugger/webinspector-dom';
import * as inspectorCommands from '@nativescript/core/debugger/InspectorBackendCommands';
import config from './env';
import { RSVP } from '@ember/-internals/runtime';
import Ember from 'ember';
import * as tracking from '@glimmer/tracking';
import * as runtime from '@glimmer/runtime';
import * as validator from '@glimmer/validator';
import * as reference from '@glimmer/reference';
import * as runloop from '@ember/runloop';
import ElementNode from './lib/dom/nodes/ElementNode';
import { CSSDomainDebugger } from '@nativescript/core/debugger/webinspector-css';

export function setupInspectorSupport() {
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

  const globalMessaging = {};

  class Event {
    target: any;
    type: any;

    constructor(type, target) {
      this.type = type;
      this.target = target;
    }

    preventDefault() {

    }
    stopPropagation() {

    }
  }

  globalThis.postMessage = (msg, origin, ports) => {
    globalMessaging['message']?.forEach((listener) => listener({
      data: msg,
      origin,
      ports
    }));
  }

  globalThis.triggerEvent = (type, element, data) => {
    const e = new Event(type, element);
    globalMessaging[type]?.forEach((cb) => {
      cb(e);
    })
  }

  globalThis.addEventListener = (type, cb) => {
    globalMessaging[type] = globalMessaging[type] || [];
    globalMessaging[type].push(cb);
  }

  globalThis.removeEventListener = (type, cb) => {
    if (type === 'message') {
      const i = globalMessaging[type].indexOf(cb);
      if (i >= 0) {
        globalMessaging[type].splice(i, 1);
      }
    }
  }

  if (document.documentElement && document.documentElement.dataset) {
    // let EmberDebug know that content script has executed
    document.documentElement.dataset.emberExtension = 1;
  }

  class Port {
    private msgId: number;
    listeners: any[];
    private otherPort: string;
    private channel: MessageChannel;
    constructor(channel: MessageChannel, otherPort: string) {
      this.channel = channel;
      this.otherPort = otherPort;
      this.msgId = 20000;
      this.listeners = [];
    }

    trigger(msg) {
      this.listeners.forEach((listener) => listener({ data: msg }));
    }

    get channelPort() {
      return this.channel[this.otherPort];
    }

    start() {

    }
    addEventListener(type, cb) {
      this.listeners.push(cb);
    }
    postMessage(msg) {
      this.channelPort.trigger(msg);
    }
  }

  class MessageChannel {
    port1 = new Port(this, 'port2');
    port2 = new Port(this, 'port1');
  }

  globalThis.MessageChannel = MessageChannel;

  globalThis.scrollX = 0;
  globalThis.scrollY = 0;
  Object.defineProperty(globalThis, 'innerWidth', {
    get() {
      return document.body?.nativeView?.getActualSize().width || 0;
    }
  })


  CSSDomainDebugger.prototype.getInlineStylesForNode = (params) => {
    const n = document.nodeMap.get(params.nodeId) as ElementNode;
    return {
      attributesStyle: {},
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
    port: MessagePort;
    private msgId: number;
    constructor() {
      this.msgId = 0;
      globalThis.addEventListener('message', (msg) => {
        if (msg.data === 'debugger-client') {
          this.port = msg.ports[0];
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
    fromExtension(msg) {
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
