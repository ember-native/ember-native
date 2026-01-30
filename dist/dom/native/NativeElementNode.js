
import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-ClPBvGFm.js';
import { KeyframeAnimation } from '@nativescript/core/ui/animation/keyframe-animation';
import { LayoutBase } from '@nativescript/core/ui/layouts/layout-base';
import { ListView, ContentView, Frame, View, isAndroid, isIOS } from '@nativescript/core';
import { CssAnimationParser } from '@nativescript/core/ui/styling/css-animation-parser';
import { TextBase } from '@nativescript/core/ui/text-base';
import ElementNode from '../nodes/ElementNode.js';

function camelize(kebab) {
  return kebab.replace(/-+(\w)/g, (_m, l) => l.toUpperCase());
}
const defaultViewMeta = {
  skipAddToDom: false
};
class NativeElementNode extends ElementNode {
  constructor(tagName, viewClass, meta = null) {
    super(tagName);
    _defineProperty(this, "_meta", void 0);
    this.nodeType = 1;
    this.tagName = tagName;
    this._meta = Object.assign({}, defaultViewMeta, meta || {});
    if (viewClass) {
      this.nativeView = new viewClass();
      this._nativeView.__GlimmerNativeElement__ = this;
    }

    // log.debug(`created ${this} ${this._nativeView}`);

    //TODO these style shims mess up the code, extract to external modules

    const setStyleAttribute = value => {
      this.setAttribute('style', value);
    };
    const getStyleAttribute = () => {
      return this.getAttribute('style');
    };
    const getParentPage = () => {
      if (this.nativeView && this.nativeView.page) {
        return this.nativeView.page.__GlimmerNativeElement__;
      }
      return null;
    };
    const animations = new Map();
    const oldAnimations = [];
    const addAnimation = animation => {
      // log.debug(`Adding animation ${animation}`);
      if (!this.nativeView) {
        throw Error('Attempt to apply animation to tag without a native view' + this.tagName);
      }
      const page = getParentPage();
      if (page == null) {
        animations.set(animation, null);
        return;
      }

      //quickly cancel any old ones
      while (oldAnimations.length) {
        const oldAnimation = oldAnimations.shift();
        if (oldAnimation.isPlaying) {
          oldAnimation.cancel();
        }
      }

      //Parse our "animation" style property into an animation info instance (this won't include the keyframes from the css)
      const animationInfos = CssAnimationParser.keyframeAnimationsFromCSSDeclarations([{
        property: 'animation',
        value: animation
      }]);
      if (!animationInfos) {
        animations.set(animation, null);
        return;
      }
      const animationInfo = animationInfos[0];

      //Fetch an animationInfo instance that includes the keyframes from the css (this won't include the animation properties parsed above)
      const animationWithKeyframes = page.nativeView.getKeyframeAnimationWithName(animationInfo.name);
      if (!animationWithKeyframes) {
        animations.set(animation, null);
        return;
      }
      animationInfo.keyframes = animationWithKeyframes.keyframes;
      //combine the keyframes from the css with the animation from the parsed attribute to get a complete animationInfo object
      const animationInstance = KeyframeAnimation.keyframeAnimationFromInfo(animationInfo);

      // save and launch the animation
      animations.set(animation, animationInstance);
      animationInstance.play(this.nativeView);
    };
    const removeAnimation = animation => {
      // log.debug(`Removing animation ${animation}`);
      if (animations.has(animation)) {
        const animationInstance = animations.get(animation);
        animations.delete(animation);
        if (animationInstance) {
          if (animationInstance.isPlaying) {
            //we don't want to stop right away since svelte removes the animation before it is finished due to our lag time starting the animation.
            oldAnimations.push(animationInstance);
          }
        }
      }
    };
    this.style = {
      setProperty: (propertyName, value) => {
        this.setStyle(camelize(propertyName), value);
      },
      // @ts-expect-error does not exist
      removeProperty: propertyName => {
        this.setStyle(camelize(propertyName), null);
      },
      get animation() {
        return [...animations.keys()].join(', ');
      },
      set animation(value) {
        // log.debug(`setting animation ${value}`);
        const new_animations = value.trim() == '' ? [] : value.split(',').map(a => a.trim());
        //add new ones
        for (const anim of new_animations) {
          if (!animations.has(anim)) {
            addAnimation(anim);
          }
        }
        //remove old ones
        for (const anim of animations.keys()) {
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
  }

  /* istanbul ignore next */
  setStyle(property, value) {
    // log.debug(`setStyle ${this} ${property} ${value}`);

    if (!value) return;
    if (!(value = value.toString().trim()).length) {
      return;
    }
    if (property.endsWith('Align')) {
      // NativeScript uses Alignment instead of Align, this ensures that text-align works
      property += 'ment';
    }
    this.nativeView.style[property] = value;
  }
  get style() {
    return this.nativeView?.style;
  }
  set style(v) {
    Object.assign(this.nativeView?.style || {}, v);
  }
  updateText() {
    const hasTextAttr = this.nativeView instanceof TextBase;
    if (hasTextAttr) {
      const t = this.childNodes.map(c => c.text).filter(Boolean).join('');
      this.setAttribute('text', t.trim());
    }
  }
  get nativeView() {
    return this._nativeView;
  }
  set nativeView(view) {
    this._nativeView = view;
    this.addEventListener('tap', () => globalThis.triggerEvent('click', this));
  }
  get meta() {
    return this._meta;
  }

  /* istanbul ignore next */
  addEventListener(event, handler) {
    // log.debug('add event listener', this, event, handler);
    this.nativeView.on(event, handler);
  }

  /* istanbul ignore next */
  removeEventListener(event, handler) {
    // log.debug(`remove event listener ${this} ${event}`);
    this.nativeView.off(event, handler);
  }
  getAttribute(fullkey) {
    let getTarget = this.nativeView;
    const keypath = fullkey.split('.');
    while (keypath.length > 0) {
      if (!getTarget) return null;
      let key = keypath.shift();

      // try to fix case
      const lowerkey = key.toLowerCase();
      for (const realKey in getTarget) {
        if (lowerkey == realKey.toLowerCase()) {
          key = realKey;
          break;
        }
      }
      if (keypath.length > 0) {
        getTarget = getTarget[key];
      } else {
        return getTarget[key];
      }
    }
    return null;
  }
  onInsertedChild(childNode, atIndex) {
    const parentNode = this;
    if (!parentNode) {
      return;
    }
    if (!(parentNode instanceof NativeElementNode) || !(childNode instanceof NativeElementNode) || !parentNode.nativeView || !childNode.nativeView) {
      return;
    }
    if (parentNode.nativeView instanceof ListView) {
      return;
    }
    if (parentNode.meta && typeof parentNode.meta.insertChild === 'function') {
      //our dom includes "textNode" and "commentNode" which does not appear in the nativeview's children.
      //we recalculate the index required for the insert operation buy only including native element nodes in the count
      const nativeIndex = parentNode.childNodes.filter(e => e instanceof NativeElementNode).indexOf(childNode);
      return parentNode.meta.insertChild(parentNode, childNode, nativeIndex);
    }
    const parentView = parentNode.nativeView;
    const childView = childNode.nativeView;

    //use the builder logic if we aren't being dynamic, to catch config items like <actionbar> that are not likely to be toggled
    if (atIndex < 0 && parentView._addChildFromBuilder) {
      parentView._addChildFromBuilder(childNode._nativeView.constructor.name, childView);
      return;
    }
    if (parentView instanceof LayoutBase) {
      if (atIndex >= 0) {
        //our dom includes "textNode" and "commentNode" which does not appear in the nativeview's children.
        //we recalculate the index required for the insert operation buy only including native element nodes in the count
        const nativeIndex = parentNode.childNodes.filter(e => e instanceof NativeElementNode).indexOf(childNode);
        parentView.insertChild(childView, nativeIndex);
      } else {
        parentView.addChild(childView);
      }
      return;
    }
    if (parentView._addChildFromBuilder) {
      return parentView._addChildFromBuilder(childNode._nativeView.constructor.name, childView);
    }
    if (parentView instanceof ContentView) {
      parentView.content = childView;
      return;
    }
  }
  onRemovedChild(childNode) {
    const parentNode = this;
    if (!parentNode) {
      return;
    }
    if (!(parentNode instanceof NativeElementNode) || !(childNode instanceof NativeElementNode) || !parentNode.nativeView || !childNode.nativeView) {
      return;
    }
    if (parentNode.meta && typeof parentNode.meta.removeChild === 'function') {
      return parentNode.meta.removeChild(parentNode, childNode);
    }
    if (!childNode.nativeView || !childNode.nativeView) {
      return;
    }
    const parentView = parentNode.nativeView;
    const childView = childNode.nativeView;
    if (parentView instanceof Frame) {
      return;
    }
    if (parentView instanceof LayoutBase) {
      parentView.removeChild(childView);
    } else if (parentView instanceof ContentView) {
      if (parentView.content === childView) {
        parentView.content = null;
      }
      if (childNode.nodeType === 8) {
        parentView._removeView(childView);
      }
    } else if (parentView instanceof View) {
      if (childNode.parentNode !== parentNode) {
        return;
      }
      parentView._removeView(childView);
    } else ;
  }

  /* istanbul ignore next */
  setAttribute(fullkey, value) {
    const nv = this.nativeView;
    let setTarget = nv;

    // normalize key
    if (isAndroid && fullkey.startsWith('android:')) {
      fullkey = fullkey.substr(8);
    }
    if (isIOS && fullkey.startsWith('ios:')) {
      fullkey = fullkey.substr(4);
    }

    //we might be getting an element from a propertyNode eg page.actionBar, unwrap
    if (value instanceof NativeElementNode) {
      value = value.nativeView;
    }
    const keypath = fullkey.split('.');
    while (keypath.length > 0) {
      if (!setTarget) return;
      let key = keypath.shift();

      // try to fix case
      const lowerkey = key.toLowerCase();
      for (const realKey in setTarget) {
        if (lowerkey == realKey.toLowerCase()) {
          key = realKey;
          break;
        }
      }
      if (keypath.length > 0) {
        setTarget = setTarget[key];
      } else {
        try {
          // log.debug(`setAttr ${this} ${resolvedKeys.join('.')} ${value}`);
          setTarget[key] = value;
        } catch (e) {
          // ignore but log
          console.error(`set attribute threw an error, attr:${key} on ${this._tagName}: ${e.message}`);
        }
      }
    }
  }
  dispatchEvent(event) {
    if (this.nativeView) {
      //nativescript uses the EventName while dom uses Type
      event.eventName = event.type;
      this.nativeView.notify(event);
    }
  }
  clear(node) {
    while (node.childNodes.length) {
      this.clear(node.firstChild);
    }
    node.parentNode.removeChild(node);
  }
  appendChild(childNode) {
    super.appendChild(childNode);
    if (childNode.nodeType === 3) {
      this.updateText();
    }
  }
  insertBefore(childNode, referenceNode) {
    super.insertBefore(childNode, referenceNode);
    if (childNode.nodeType === 3) {
      this.updateText();
    }
  }
  removeChild(childNode) {
    super.removeChild(childNode);
    if (childNode.nodeType === 3) {
      this.updateText();
    }
  }
  removeChildren() {
    while (this.childNodes.length) {
      this.clear(this.firstChild);
    }
  }
  getBoundingClientRect() {
    if (!this.nativeView) return null;
    if (!this.nativeView.getLocationInWindow) return null;
    const nw = this.nativeView;
    const point = nw.getLocationInWindow();
    const actualSize = nw.getActualSize();
    if (!point) {
      return {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0
      };
    }
    return {
      left: point.x,
      top: point.y,
      bottom: point.y + actualSize.height,
      width: actualSize.width,
      height: actualSize.height
    };
  }
}

export { NativeElementNode as default };
//# sourceMappingURL=NativeElementNode.js.map
