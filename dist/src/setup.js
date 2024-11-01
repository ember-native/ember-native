"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var loader = require("loader.js");
var DocumentNode_1 = require("~/lib/dom/nodes/DocumentNode");
var setup_registry_1 = require("~/lib/dom/setup-registry");
var runtime_1 = require("@glimmer/runtime");
globalThis.requireModule = loader.require;
globalThis.requirejs = loader.require;
globalThis.define = loader.define;
globalThis.document = new DocumentNode_1.default();
runtime_1.SimpleDynamicAttribute.prototype.set = function (dom, value, _env) {
    var _a = this.attribute, name = _a.name, namespace = _a.namespace;
    dom.__setAttribute(name, value, namespace);
};
runtime_1.SimpleDynamicAttribute.prototype.update = function (value, _env) {
    var normalizedValue = value;
    var _a = this.attribute, element = _a.element, name = _a.name;
    if (null === normalizedValue) {
        element.removeAttribute(name);
    }
    else {
        element.setAttribute(name, normalizedValue);
    }
};
(0, setup_registry_1.registerElements)();
