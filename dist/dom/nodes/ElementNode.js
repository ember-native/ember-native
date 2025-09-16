
import { _ as _defineProperty } from '../../_rollupPluginBabelHelpers-ClPBvGFm.js';
import ViewNode from './ViewNode.js';

var _ElementNode;

// import { getViewClass } from '../element-registry';
// import ViewNode from './ViewNode';

// function camelize(kebab) {
//     return kebab.replace(/[\-]+(\w)/g, (m, l) => l.toUpperCase());
// }

// const EVENT_ATTRIBUTES = Object.freeze(['tap']);

// export default class ElementNode extends ViewNode {
//     style: any;
//     animations: Map<string, KeyframeAnimation> = new Map();
//     oldAnimations: KeyframeAnimation[] = [];
//     constructor(tagName: any) {
//         super();

//         this.nodeType = 1;
//         this.tagName = tagName;

//         //there are some special elements that don't exist natively
//         const viewClass = getViewClass(tagName);
//         if (viewClass) {
//             this._nativeView = new viewClass();
//             this._nativeView.__GlimmerNativeElement__ = this;
//             // console.log(`${this} has view class`);
//             EVENT_ATTRIBUTES.forEach((event) => {
//                 // console.log(`Checking for atttribute ${event}`);
//                 let attribute = this.getAttribute(event);
//                 // console.log(`Attribute ${event}: ${attribute}`);
//                 // console.log(`Native view attribute ${event}: ${this._nativeView.getAttribute(event)}`);
//                 if (attribute) {
//                     this.addEventListener(event, attribute);
//                 }
//             });
//         }

//         // console.log(`created ${this} ${this._nativeView}`);

//         let setStyle = (value) => {
//             this.setAttribute('style', value);
//         };

//         let getStyle = () => {
//             return this.getAttribute('style');
//         };

//         this.style = {
//             setProperty: (propertyName, value, priority) => {
//                 this.setStyle(camelize(propertyName), value);
//             },

//             removeProperty: (propertyName) => {
//                 this.setStyle(camelize(propertyName), null);
//             },

//             get cssText() {
//                 // console.log('got css text');
//                 return getStyle();
//             },

//             set cssText(value) {
//                 // console.log('set css text');
//                 setStyle(value);
//             }
//         };
//     }

//     animate(options) {
//         if (this.nativeView) {
//             this.nativeView.animate(options);
//         }
//     }

//     getParentPage(): ElementNode {
//         if (this.nativeView && this.nativeView.page) {
//             return (this.nativeView.page as any).__GlimmerNativeElement__;
//         }
//         return null;
//     }

//     addAnimation(animation: string) {
//         if (!this.nativeView) {
//             throw Error('Attempt to apply animation to tag without a native view' + this.tagName);
//         }

//         let page = this.getParentPage();
//         if (page === null) {
//             this.animations.set(animation, null);
//             return;
//         }

//         //quickly cancel any old ones
//         while (this.oldAnimations.length) {
//             let oldAnimation = this.oldAnimations.shift();
//             if (oldAnimation.isPlaying) {
//                 oldAnimation.cancel();
//             }
//         }

//         //Parse our "animation" style property into an animation info instance (this won't include the keyframes from the css)
//         let animationInfos = CssAnimationParser.keyframeAnimationsFromCSSDeclarations([
//             { property: 'animation', value: animation }
//         ]);
//         if (!animationInfos) {
//             this.animations.set(animation, null);
//             return;
//         }
//         let animationInfo = animationInfos[0];

//         //Fetch an animationInfo instance that includes the keyframes from the css (this won't include the animation properties parsed above)
//         let animationWithKeyframes = (page.nativeView as Page).getKeyframeAnimationWithName(animationInfo.name);
//         if (!animationWithKeyframes) {
//             this.animations.set(animation, null);
//             return;
//         }

//         animationInfo.keyframes = animationWithKeyframes.keyframes;
//         //combine the keyframes from the css with the animation from the parsed attribute to get a complete animationInfo object
//         let animationInstance = KeyframeAnimation.keyframeAnimationFromInfo(animationInfo);

//         // save and launch the animation
//         this.animations.set(animation, animationInstance);
//         animationInstance.play(this.nativeView);
//     }

//     removeAnimation(animation: string) {
//         if (this.animations.has(animation)) {
//             let animationInstance = this.animations.get(animation);
//             this.animations.delete(animation);

//             if (animationInstance) {
//                 if (animationInstance.isPlaying) {
//                     //we don't want to stop right away since svelte removes the animation before it is finished due to our lag time starting the animation.
//                     this.oldAnimations.push(animationInstance);
//                 }
//             }
//         }
//     }

//     get animation(): string {
//         return [...this.animations.keys()].join(', ');
//     }

//     set animation(value: string) {
//         let new_animations = value.trim() == '' ? [] : value.split(',').map((a) => a.trim());
//         //add new ones
//         for (let anim of new_animations) {
//             if (!this.animations.has(anim)) {
//                 this.addAnimation(anim);
//             }
//         }
//         //remove old ones
//         for (let anim of this.animations.keys()) {
//             if (new_animations.indexOf(anim) < 0) {
//                 this.removeAnimation(anim);
//             }
//         }
//     }

//     setAttribute(key, value) {
//         // console.log(`setAttribute: ${key} - ${value}`);
//         if (key.startsWith('on:')) {
//             key = key.substr(3);
//             this.addEventListener(key, value);
//         } else {
//             super.setAttribute(key, value);
//         }
//     }

//     appendChild(childNode) {
//         super.appendChild(childNode);

//         if (childNode.nodeType === 3) {
//             this.setText(childNode.text);
//         }

//         if (childNode.nodeType === 7) {
//             childNode.setOnNode(this);
//         }
//     }

//     insertBefore(childNode, referenceNode) {
//         super.insertBefore(childNode, referenceNode);

//         if (childNode.nodeType === 3) {
//             this.setText(childNode.text);
//         }

//         if (childNode.nodeType === 7) {
//             childNode.setOnNode(this);
//         }
//     }

//     removeChild(childNode) {
//         super.removeChild(childNode);

//         if (childNode.nodeType === 3) {
//             this.setText('');
//         }

//         if (childNode.nodeType === 7) {
//             childNode.clearOnNode(this);
//         }
//     }
// }

class ElementNode extends ViewNode {
  constructor(tagName) {
    super();
    this.nodeType = 1;
    this.tagName = tagName;
  }
  get id() {
    if (this.getAttribute === ElementNode.prototype.getAttribute) {
      return this['_id'];
    }
    return this.getAttribute('id');
  }
  set id(v) {
    if (this.getAttribute === ElementNode.prototype.getAttribute) {
      this['_id'] = v;
      return;
    }
    this.setAttribute('id', v);
  }
  get classList() {
    if (!this._classList) {
      const getClasses = () => (this.getAttribute('class') || '').split(/\s+/).filter(k => k != '');
      this._classList = {
        add: (...classNames) => {
          this.setAttribute('class', [...new Set(getClasses().concat(classNames))].join(' '));
        },
        contains(klass) {
          return Boolean(getClasses().find(x => x === klass));
        },
        remove: (...classNames) => {
          this.setAttribute('class', getClasses().filter(i => classNames.indexOf(i) == -1).join(' '));
        },
        get length() {
          return getClasses().length;
        }
      };
    }
    return this._classList;
  }
  appendChild(childNode) {
    super.appendChild(childNode);
    if (childNode.nodeType === 7) {
      childNode.setOnNode(this);
    }
  }
  insertBefore(childNode, referenceNode) {
    super.insertBefore(childNode, referenceNode);
    if (childNode.nodeType === 7) {
      childNode.setOnNode(this);
    }
  }
  removeChild(childNode) {
    super.removeChild(childNode);
    if (childNode.nodeType === 7) {
      childNode.clearOnNode(this);
    }
  }
}
_ElementNode = ElementNode;
_defineProperty(ElementNode, "ELEMENT_NODE", void 0);
_defineProperty(ElementNode, "ATTRIBUTE_NODE", void 0);
_defineProperty(ElementNode, "TEXT_NODE", void 0);
_defineProperty(ElementNode, "DOCUMENT_NODE", void 0);
(() => {
  _ElementNode.ELEMENT_NODE = 1; //Node.ELEMENT_NODE
  _ElementNode.ATTRIBUTE_NODE = 2; //Node.ATTRIBUTE_NODE
  _ElementNode.TEXT_NODE = 3; //Node.TEXT_NODE
  _ElementNode.DOCUMENT_NODE = 9; //Node.DOCUMENT_NODE
})();

export { ElementNode as default };
//# sourceMappingURL=ElementNode.js.map
