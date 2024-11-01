"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var keyframe_animation_1 = require("@nativescript/core/ui/animation/keyframe-animation");
var layout_base_1 = require("@nativescript/core/ui/layouts/layout-base");
var core_1 = require("@nativescript/core");
var css_animation_parser_1 = require("@nativescript/core/ui/styling/css-animation-parser");
var ElementNode_1 = require("../nodes/ElementNode");
function camelize(kebab) {
    return kebab.replace(/[\-]+(\w)/g, function (m, l) { return l.toUpperCase(); });
}
var defaultViewMeta = {
    skipAddToDom: false
};
var NativeElementNode = /** @class */ (function (_super) {
    __extends(NativeElementNode, _super);
    function NativeElementNode(tagName, viewClass, meta) {
        if (meta === void 0) { meta = null; }
        var _this = _super.call(this, tagName) || this;
        _this.nodeType = 1;
        _this.tagName = tagName;
        _this._meta = Object.assign({}, defaultViewMeta, meta || {});
        _this.nativeView = new viewClass();
        _this._nativeView.__GlimmerNativeElement__ = _this;
        // log.debug(`created ${this} ${this._nativeView}`);
        //TODO these style shims mess up the code, extract to external modules
        var setStyleAttribute = function (value) {
            _this.setAttribute('style', value);
        };
        var getStyleAttribute = function () {
            return _this.getAttribute('style');
        };
        var getParentPage = function () {
            if (_this.nativeView && _this.nativeView.page) {
                return _this.nativeView.page.__GlimmerNativeElement__;
            }
            return null;
        };
        var animations = new Map();
        var oldAnimations = [];
        var addAnimation = function (animation) {
            // log.debug(`Adding animation ${animation}`);
            if (!_this.nativeView) {
                throw Error('Attempt to apply animation to tag without a native view' + _this.tagName);
            }
            var page = getParentPage();
            if (page == null) {
                animations.set(animation, null);
                return;
            }
            //quickly cancel any old ones
            while (oldAnimations.length) {
                var oldAnimation = oldAnimations.shift();
                if (oldAnimation.isPlaying) {
                    oldAnimation.cancel();
                }
            }
            //Parse our "animation" style property into an animation info instance (this won't include the keyframes from the css)
            var animationInfos = css_animation_parser_1.CssAnimationParser.keyframeAnimationsFromCSSDeclarations([
                { property: 'animation', value: animation }
            ]);
            if (!animationInfos) {
                animations.set(animation, null);
                return;
            }
            var animationInfo = animationInfos[0];
            //Fetch an animationInfo instance that includes the keyframes from the css (this won't include the animation properties parsed above)
            var animationWithKeyframes = page.nativeView.getKeyframeAnimationWithName(animationInfo.name);
            if (!animationWithKeyframes) {
                animations.set(animation, null);
                return;
            }
            animationInfo.keyframes = animationWithKeyframes.keyframes;
            //combine the keyframes from the css with the animation from the parsed attribute to get a complete animationInfo object
            var animationInstance = keyframe_animation_1.KeyframeAnimation.keyframeAnimationFromInfo(animationInfo);
            // save and launch the animation
            animations.set(animation, animationInstance);
            animationInstance.play(_this.nativeView);
        };
        var removeAnimation = function (animation) {
            // log.debug(`Removing animation ${animation}`);
            if (animations.has(animation)) {
                var animationInstance = animations.get(animation);
                animations.delete(animation);
                if (animationInstance) {
                    if (animationInstance.isPlaying) {
                        //we don't want to stop right away since svelte removes the animation before it is finished due to our lag time starting the animation.
                        oldAnimations.push(animationInstance);
                    }
                }
            }
        };
        _this.style = {
            setProperty: function (propertyName, value, priority) {
                _this.setStyle(camelize(propertyName), value);
            },
            removeProperty: function (propertyName) {
                _this.setStyle(camelize(propertyName), null);
            },
            get animation() {
                return __spreadArray([], animations.keys(), true).join(', ');
            },
            set animation(value) {
                // log.debug(`setting animation ${value}`);
                var new_animations = value.trim() == '' ? [] : value.split(',').map(function (a) { return a.trim(); });
                //add new ones
                for (var _i = 0, new_animations_1 = new_animations; _i < new_animations_1.length; _i++) {
                    var anim = new_animations_1[_i];
                    if (!animations.has(anim)) {
                        addAnimation(anim);
                    }
                }
                //remove old ones
                for (var _a = 0, _b = animations.keys(); _a < _b.length; _a++) {
                    var anim = _b[_a];
                    if (new_animations.indexOf(anim) < 0) {
                        removeAnimation(anim);
                    }
                }
            },
            get cssText() {
                // log.debug('got css text');
                return getStyleAttribute();
            },
            set cssText(value) {
                // log.debug('set css text');
                setStyleAttribute(value);
            }
        };
        return _this;
    }
    /* istanbul ignore next */
    NativeElementNode.prototype.setStyle = function (property, value) {
        // log.debug(`setStyle ${this} ${property} ${value}`);
        if (!(value = value.toString().trim()).length) {
            return;
        }
        if (property.endsWith('Align')) {
            // NativeScript uses Alignment instead of Align, this ensures that text-align works
            property += 'ment';
        }
        this.nativeView.style[property] = value;
    };
    Object.defineProperty(NativeElementNode.prototype, "nativeView", {
        get: function () {
            return this._nativeView;
        },
        set: function (view) {
            var _this = this;
            this._nativeView = view;
            this.addEventListener('tap', function () { return globalThis.triggerEvent('click', _this); });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NativeElementNode.prototype, "meta", {
        get: function () {
            return this._meta;
        },
        enumerable: false,
        configurable: true
    });
    /* istanbul ignore next */
    NativeElementNode.prototype.addEventListener = function (event, handler) {
        // log.debug('add event listener', this, event, handler);
        this.nativeView.on(event, handler);
    };
    /* istanbul ignore next */
    NativeElementNode.prototype.removeEventListener = function (event, handler) {
        // log.debug(`remove event listener ${this} ${event}`);
        this.nativeView.off(event, handler);
    };
    NativeElementNode.prototype.getAttribute = function (fullkey) {
        var getTarget = this.nativeView;
        var keypath = fullkey.split('.');
        var resolvedKeys = [];
        while (keypath.length > 0) {
            if (!getTarget)
                return null;
            var key = keypath.shift();
            // try to fix case
            var lowerkey = key.toLowerCase();
            for (var realKey in getTarget) {
                if (lowerkey == realKey.toLowerCase()) {
                    key = realKey;
                    break;
                }
            }
            resolvedKeys.push(key);
            if (keypath.length > 0) {
                getTarget = getTarget[key];
            }
            else {
                return getTarget[key];
            }
        }
        return null;
    };
    NativeElementNode.prototype.onInsertedChild = function (childNode, index) {
        insertChild(this, childNode, index);
    };
    NativeElementNode.prototype.onRemovedChild = function (childNode) {
        removeChild(this, childNode);
    };
    /* istanbul ignore next */
    NativeElementNode.prototype.setAttribute = function (fullkey, value) {
        var nv = this.nativeView;
        var setTarget = nv;
        // normalize key
        if (core_1.isAndroid && fullkey.startsWith('android:')) {
            fullkey = fullkey.substr(8);
        }
        if (core_1.isIOS && fullkey.startsWith('ios:')) {
            fullkey = fullkey.substr(4);
        }
        //we might be getting an element from a propertyNode eg page.actionBar, unwrap
        if (value instanceof NativeElementNode) {
            value = value.nativeView;
        }
        var keypath = fullkey.split('.');
        var resolvedKeys = [];
        while (keypath.length > 0) {
            if (!setTarget)
                return;
            var key = keypath.shift();
            // try to fix case
            var lowerkey = key.toLowerCase();
            for (var realKey in setTarget) {
                if (lowerkey == realKey.toLowerCase()) {
                    key = realKey;
                    break;
                }
            }
            resolvedKeys.push(key);
            if (keypath.length > 0) {
                setTarget = setTarget[key];
            }
            else {
                try {
                    // log.debug(`setAttr ${this} ${resolvedKeys.join('.')} ${value}`);
                    setTarget[key] = value;
                }
                catch (e) {
                    // ignore but log
                    // log.error(`set attribute threw an error, attr:${key} on ${this._tagName}: ${e.message}`);
                }
            }
        }
    };
    NativeElementNode.prototype.dispatchEvent = function (event) {
        if (this.nativeView) {
            //nativescript uses the EventName while dom uses Type
            event.eventName = event.type;
            this.nativeView.notify(event);
        }
    };
    NativeElementNode.prototype.clear = function (node) {
        while (node.childNodes.length) {
            this.clear(node.firstChild);
        }
        node.parentNode.removeChild(node);
    };
    NativeElementNode.prototype.removeChildren = function () {
        while (this.childNodes.length) {
            this.clear(this.firstChild);
        }
    };
    return NativeElementNode;
}(ElementNode_1.default));
exports.default = NativeElementNode;
//TODO merge these into the class above
function insertChild(parentNode, childNode, atIndex) {
    if (atIndex === void 0) { atIndex = -1; }
    if (!parentNode) {
        return;
    }
    if (!(parentNode instanceof NativeElementNode) || !(childNode instanceof NativeElementNode)) {
        return;
    }
    if (parentNode.meta && typeof parentNode.meta.insertChild === 'function') {
        //our dom includes "textNode" and "commentNode" which does not appear in the nativeview's children.
        //we recalculate the index required for the insert operation buy only including native element nodes in the count
        var nativeIndex = parentNode.childNodes.filter(function (e) { return e instanceof NativeElementNode; }).indexOf(childNode);
        return parentNode.meta.insertChild(parentNode, childNode, nativeIndex);
    }
    var parentView = parentNode.nativeView;
    var childView = childNode.nativeView;
    //use the builder logic if we aren't being dynamic, to catch config items like <actionbar> that are not likely to be toggled
    if (atIndex < 0 && parentView._addChildFromBuilder) {
        parentView._addChildFromBuilder(childNode._nativeView.constructor.name, childView);
        return;
    }
    if (parentView instanceof layout_base_1.LayoutBase) {
        if (atIndex >= 0) {
            //our dom includes "textNode" and "commentNode" which does not appear in the nativeview's children.
            //we recalculate the index required for the insert operation buy only including native element nodes in the count
            var nativeIndex = parentNode.childNodes.filter(function (e) { return e instanceof NativeElementNode; }).indexOf(childNode);
            parentView.insertChild(childView, nativeIndex);
        }
        else {
            parentView.addChild(childView);
        }
        return;
    }
    if (parentView._addChildFromBuilder) {
        return parentView._addChildFromBuilder(childNode._nativeView.constructor.name, childView);
    }
    if (parentView instanceof core_1.ContentView) {
        parentView.content = childView;
        return;
    }
    throw new Error("Parent can't contain children: " + parentNode + ', ' + childNode);
}
function removeChild(parentNode, childNode) {
    if (!parentNode) {
        return;
    }
    if (!(parentNode instanceof NativeElementNode) || !(childNode instanceof NativeElementNode)) {
        return;
    }
    if (parentNode.meta && typeof parentNode.meta.removeChild === 'function') {
        return parentNode.meta.removeChild(parentNode, childNode);
    }
    if (!childNode.nativeView || !childNode.nativeView) {
        return;
    }
    var parentView = parentNode.nativeView;
    var childView = childNode.nativeView;
    if (parentView instanceof layout_base_1.LayoutBase) {
        parentView.removeChild(childView);
    }
    else if (parentView instanceof core_1.ContentView) {
        if (parentView.content === childView) {
            parentView.content = null;
        }
        if (childNode.nodeType === 8) {
            parentView._removeView(childView);
        }
    }
    else if (parentView instanceof core_1.View) {
        parentView._removeView(childView);
    }
    else {
        // throw new Error("Unknown parent type: " + parent);
    }
}
