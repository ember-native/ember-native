
import { _ as _defineProperty } from './_rollupPluginBabelHelpers-ClPBvGFm.js';
import { DOMDomainDebugger } from '@nativescript/core/debugger/webinspector-dom';
import * as inspectorCommands from '@nativescript/core/debugger/InspectorBackendCommands';
import { RSVP } from '@ember/-internals/runtime';
import Ember from 'ember';
import * as tracking from '@glimmer/tracking';
import * as runtime from '@glimmer/runtime';
import * as validator from '@glimmer/validator';
import * as reference from '@glimmer/reference';
import * as runloop from '@ember/runloop';

function setupInspectorSupport(config) {
  window.define('@glimmer/tracking', () => tracking);
  window.define('@glimmer/runtime', () => runtime);
  window.define('@glimmer/validator', () => validator);
  window.define('@glimmer/reference', () => reference);
  window.define('@ember/runloop', () => runloop);
  window.define('rsvp', () => RSVP);
  window.define('ember', () => ({
    default: Ember
  }));
  window.define('doc-app/config/environment', () => ({
    default: config
  }));
  console.debug = console.log;
  const globalMessaging = {};
  class Event {
    constructor(type, target) {
      _defineProperty(this, "target", void 0);
      _defineProperty(this, "type", void 0);
      this.type = type;
      this.target = target;
    }
    preventDefault() {}
    stopPropagation() {}
  }
  globalThis.postMessage = (msg, origin, ports) => {
    globalMessaging['message']?.forEach(listener => listener({
      data: msg,
      origin,
      ports
    }));
  };
  globalThis.triggerEvent = (type, element, _data) => {
    const e = new Event(type, element);
    globalMessaging[type]?.forEach(cb => {
      cb(e);
    });
  };
  globalThis.addEventListener = (type, cb) => {
    globalMessaging[type] = globalMessaging[type] || [];
    globalMessaging[type].push(cb);
  };
  globalThis.removeEventListener = (type, cb) => {
    if (type === 'message') {
      const i = globalMessaging[type]?.indexOf(cb) || -1;
      if (i >= 0) {
        globalMessaging[type].splice(i, 1);
      }
    }
  };
  if (document.documentElement && document.documentElement.dataset) {
    // let EmberDebug know that content script has executed
    document.documentElement.dataset['emberExtension'] = '1';
  }
  class Port {
    constructor(channel, otherPort) {
      _defineProperty(this, "msgId", void 0);
      _defineProperty(this, "listeners", void 0);
      _defineProperty(this, "otherPort", void 0);
      _defineProperty(this, "channel", void 0);
      this.channel = channel;
      this.otherPort = otherPort;
      this.msgId = 20000;
      this.listeners = [];
    }
    trigger(msg) {
      this.listeners.forEach(listener => listener({
        data: msg
      }));
    }
    get channelPort() {
      return this.channel[this.otherPort];
    }
    start() {}
    addEventListener(_type, cb) {
      this.listeners.push(cb);
    }
    postMessage(msg) {
      this.channelPort.trigger(msg);
    }
  }
  class MessageChannel {
    constructor() {
      _defineProperty(this, "port1", new Port(this, 'port2'));
      _defineProperty(this, "port2", new Port(this, 'port1'));
    }
  }
  globalThis.MessageChannel = MessageChannel;
  globalThis.scrollX = 0;
  globalThis.scrollY = 0;
  Object.defineProperty(globalThis, 'innerWidth', {
    get() {
      return document.body?.nativeView?.getActualSize().width || 0;
    }
  });
  DOMDomainDebugger.prototype.resolveNode = params => {
    const n = document.nodeMap.get(params.nodeId);
    return {
      object: {
        type: 'object',
        className: n.constructor.name,
        value: n,
        objectId: 'dont know'
      }
    };
  };
  let _EmberDomain = class EmberDomain {
    constructor() {
      _defineProperty(this, "port", void 0);
      _defineProperty(this, "msgId", void 0);
      this.msgId = 0;
      globalThis.addEventListener('message', msg => {
        if (msg.data === 'debugger-client') {
          this.port = msg.ports[0];
          this.port.addEventListener('message', msg => {
            __inspectorSendEvent(JSON.stringify({
              id: this.msgId++,
              method: 'Ember.toExtension',
              params: msg
            }));
          });
        }
      });
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
        } catch (e) {
          console.error(e);
        }
      }
    }
  };
  _EmberDomain = __decorate([inspectorCommands.DomainDispatcher('Ember'), __metadata('design:paramtypes', [])], _EmberDomain);
}

export { setupInspectorSupport };
//# sourceMappingURL=setup-inspector-support.js.map
