"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var webinspector_dom_1 = require("@nativescript/core/debugger/webinspector-dom");
var inspectorCommands = require("@nativescript/core/debugger/InspectorBackendCommands");
var env_1 = require("./env");
var runtime_1 = require("@ember/-internals/runtime");
var ember_1 = require("ember");
var tracking = require("@glimmer/tracking");
var runtime = require("@glimmer/runtime");
var validator = require("@glimmer/validator");
var reference = require("@glimmer/reference");
var runloop = require("@ember/runloop");
var ElementNode_1 = require("./lib/dom/nodes/ElementNode");
var webinspector_css_1 = require("@nativescript/core/debugger/webinspector-css");
console.log('inspector support');
globalThis.HTMLElement = ElementNode_1.default;
globalThis.window = globalThis;
window.define('@glimmer/tracking', function () { return tracking; });
window.define('@glimmer/runtime', function () { return runtime; });
window.define('@glimmer/validator', function () { return validator; });
window.define('@glimmer/reference', function () { return reference; });
window.define('@ember/runloop', function () { return runloop; });
window.define('rsvp', function () { return runtime_1.RSVP; });
window.define('ember', function () { return ({ default: ember_1.default }); });
window.define('doc-app/config/environment', function () { return ({
    default: env_1.default,
}); });
console.debug = console.log;
var globalMessaging = {};
var Event = /** @class */ (function () {
    function Event(type, target) {
        this.type = type;
        this.target = target;
    }
    Event.prototype.preventDefault = function () {
    };
    Event.prototype.stopPropagation = function () {
    };
    return Event;
}());
globalThis.postMessage = function (msg, origin, ports) {
    var _a;
    (_a = globalMessaging['message']) === null || _a === void 0 ? void 0 : _a.forEach(function (listener) { return listener({
        data: msg,
        origin: origin,
        ports: ports
    }); });
};
globalThis.triggerEvent = function (type, element, data) {
    var _a;
    console.log('triggerevent', type, data, globalMessaging[type]);
    var e = new Event(type, element);
    (_a = globalMessaging[type]) === null || _a === void 0 ? void 0 : _a.forEach(function (cb) {
        cb(e);
    });
};
globalThis.addEventListener = function (type, cb) {
    console.log('global addEventListener', type, cb);
    globalMessaging[type] = globalMessaging[type] || [];
    globalMessaging[type].push(cb);
    console.log('addEventListener', type);
};
globalThis.removeEventListener = function (type, cb) {
    if (type === 'message') {
        var i = globalMessaging[type].indexOf(cb);
        if (i >= 0) {
            globalMessaging[type].splice(i, 1);
        }
    }
};
if (document.documentElement && document.documentElement.dataset) {
    // let EmberDebug know that content script has executed
    document.documentElement.dataset.emberExtension = 1;
}
var Port = /** @class */ (function () {
    function Port(channel, otherPort) {
        this.channel = channel;
        this.otherPort = otherPort;
        console.log('port');
        this.msgId = 20000;
        this.listeners = [];
    }
    Port.prototype.trigger = function (msg) {
        this.listeners.forEach(function (listener) { return listener({ data: msg }); });
    };
    Object.defineProperty(Port.prototype, "channelPort", {
        get: function () {
            return this.channel[this.otherPort];
        },
        enumerable: false,
        configurable: true
    });
    Port.prototype.start = function () {
    };
    Port.prototype.addEventListener = function (type, cb) {
        this.listeners.push(cb);
    };
    Port.prototype.postMessage = function (msg) {
        this.channelPort.trigger(msg);
    };
    return Port;
}());
var MessageChannel = /** @class */ (function () {
    function MessageChannel() {
        this.port1 = new Port(this, 'port2');
        this.port2 = new Port(this, 'port1');
    }
    return MessageChannel;
}());
globalThis.MessageChannel = MessageChannel;
globalThis.scrollX = 0;
globalThis.scrollY = 0;
Object.defineProperty(globalThis, 'innerWidth', {
    get: function () {
        var _a, _b;
        return ((_b = (_a = document.body) === null || _a === void 0 ? void 0 : _a.nativeView) === null || _b === void 0 ? void 0 : _b.getActualSize().width) || 0;
    }
});
webinspector_css_1.CSSDomainDebugger.prototype.getInlineStylesForNode = function (params) {
    var n = document.nodeMap.get(params.nodeId);
    console.log('getInlineStylesForNode', n.style);
    return {
        attributesStyle: {},
        inlineStyle: {
            shorthandEntries: [],
            cssProperties: Object.entries(n.style).map(function (_a) {
                var k = _a[0], v = _a[1];
                return ({
                    name: k,
                    value: String(v)
                });
            })
        }
    };
};
webinspector_dom_1.DOMDomainDebugger.prototype.resolveNode = (function (params) {
    var n = document.nodeMap.get(params.nodeId);
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
var EmberDomain = /** @class */ (function () {
    function EmberDomain() {
        var _this = this;
        this.msgId = 0;
        globalThis.addEventListener('message', function (msg) {
            console.log('global message', msg);
            if (msg.data === 'debugger-client') {
                _this.port = msg.ports[0];
                _this.port.addEventListener('message', function (msg) {
                    console.log('port message', msg);
                    __inspectorSendEvent(JSON.stringify({
                        id: _this.msgId++,
                        method: 'Ember.toExtension',
                        params: msg,
                    }));
                });
            }
        });
    }
    EmberDomain.prototype.fromExtension = function (msg) {
        var _a;
        console.log('ember fromExtension', msg);
        try {
            if (msg.type) {
                (_a = this.port) === null || _a === void 0 ? void 0 : _a.postMessage(msg);
            }
        }
        catch (e) {
            console.error(e);
        }
        if (msg.type === 'inject-code' && !globalThis.emberDebugInjected) {
            console.log('inject');
            globalThis.emberDebugInjected = true;
            try {
                eval('console.log("hi")');
                eval(msg.value);
            }
            catch (e) {
                console.error(e);
            }
        }
    };
    return EmberDomain;
}());
EmberDomain = __decorate([
    inspectorCommands.DomainDispatcher('Ember'),
    __metadata("design:paramtypes", [])
], EmberDomain);
setInterval(function () {
    return;
    __inspectorSendEvent(JSON.stringify({
        id: Math.random() * 200000,
        method: 'Ember.toExtension',
        params: {
            test: 'x'
        },
    }));
}, 5000);
