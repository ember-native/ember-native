# Router Transitions

to use the native transitions you have to use the `native-router` service.

e.g.

```js
import Component from "@glimmer/component";

export default class Page extends Component {
  @service("ember-native/native-router") nativeRouter;

  goto() {
    this.nativeRouter.transitionTo("route-name", model || null, {
      transition: myTransition,
      animated: true || false,
    });
  }
}
```

where my transition has the following interface:

```ts
// copied from nativescript source
interface NavigationTransition {
  /**
   * Can be one of the built-in transitions:
   * - curl (same as curlUp) (iOS only)
   * - curlUp (iOS only)
   * - curlDown (iOS only)
   * - explode (Android Lollipop(21) and up only)
   * - fade
   * - flip (same as flipRight)
   * - flipRight
   * - flipLeft
   * - slide (same as slideLeft)
   * - slideLeft
   * - slideRight
   * - slideTop
   * - slideBottom
   */
  name?: string;

  /**
   * An user-defined instance of the "ui/transition".Transition class.
   */
  instance?: Transition;

  /**
   * The length of the transition in milliseconds. If you do not specify this, the default platform transition duration will be used.
   */
  duration?: number;

  /**
   * An optional transition animation curve. Possible values are contained in the [AnimationCurve enumeration](https://docs.nativescript.org/api-reference/modules/_ui_enums_.animationcurve.html).
   * Alternatively, you can pass an instance of type UIViewAnimationCurve for iOS or android.animation.TimeInterpolator for Android.
   */
  curve?: any;
}
```
