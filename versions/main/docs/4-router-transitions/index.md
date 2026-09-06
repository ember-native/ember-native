# Router Transitions

Routes render under a real NativeScript `Frame`, so navigating between them
can play the same native, animated push/pop transitions any (non-Ember)
NativeScript app can. To trigger one, use the `native-router` service instead
of `@ember/routing/route-info`/the router service directly:

```js
import Component from "@glimmer/component";
import { service } from "@ember/service";

export default class Page extends Component {
  @service("ember-native/native-router") nativeRouter;

  goto() {
    this.nativeRouter.transitionTo("route-name", model || null, queryParams, {
      transition: myTransition,
      animated: true,
    });
  }
}
```

`transitionTo(name, model, queryParams, transition, backTransition)` sets the
given `transition` just before calling the normal Ember `Router#transitionTo`.
It's picked up the next time a `<page>` is pushed for this route change and
passed straight to NativeScript's `Frame#navigate()`, which plays the
animation. The optional `backTransition` is what plays when navigating back
_out_ of the destination instead (replayed by the `history` service's
`back()`), letting a push and its corresponding pop use different
transitions:

```js
this.nativeRouter.transitionTo(
  "route-name",
  model,
  undefined,
  { transition: { name: "slide", direction: "left" }, animated: true },
  { transition: { name: "slide", direction: "right" }, animated: true },
);
```

`transition`/`backTransition` are each `{ transition: NavigationTransition, animated: boolean }`, where `NavigationTransition` is:

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

See [Sub-routes and back navigation](./frame-outlet) for how child routes
stack on top of a parent route without re-rendering it, and how back
navigation (hardware back button, iOS edge-swipe) stays in sync with Ember's
router. For navigation that isn't router-driven at all (a wizard,
master/detail inside a single route), see
[Manual stacks, via `PageStack`/`PageStackView`](./page-stack) instead.
