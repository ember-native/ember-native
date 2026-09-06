# Manual stacks, via `PageStack`/`PageStackView`

For navigation that isn't router-driven (e.g. a wizard, or master/detail
inside a single route), use the `PageStack` class directly instead of the
router: it's a small tracked stack of entries that, once pushed, stay mounted
until explicitly evicted - only `activeKey` changes when navigating back and
forth. Unlike [router-driven navigation](./frame-outlet), it's not backed by
a real `Frame` backstack, so it toggles `visibility` between entries instead.

`PageStackView` renders one for you, invoking each pushed entry with an
`@isActive` boolean rather than wrapping it in a container of its own to
toggle - a `<page>` can only be a direct child of a `<frame>` (or the app's
own root), so wrapping one to toggle its visibility would crash at runtime
with `Page can only be nested inside Frame`; apply `@isActive` as the
`visibility` of your own root element directly instead:

```gts
import { PageStackView } from "ember-native/components";
import PageStack from "ember-native/page-stack";
import { on } from "@ember/modifier";
import { fn } from "@ember/helper";
import StepOne from "./step-one";

class Wizard extends Component {
  stack = new PageStack();
  push = (content, key) => this.stack.push(content, key);
  back = () => this.stack.pop();

  <template>
    <PageStackView @stack={{this.stack}} />
    <button {{on "tap" (fn this.push StepOne "step-one")}}>Start</button>
  </template>
}
```

```gts
// step-one.gts - a pushed component that uses `@isActive` needs it declared
// in its own Args signature, and applies it to its own root element's
// `visibility`. A pushed component that ignores `@isActive` entirely (e.g.
// static content with nothing to hide) doesn't need either.
interface StepOneSignature {
  Args: { isActive: boolean };
}

class StepOne extends Component<StepOneSignature> {
  <template>
    <stack-layout visibility={{if @isActive "visible" "collapse"}}>
      {{! ...this step's own content... }}
    </stack-layout>
  </template>
}
```

An entry's `content` is anything invokable as a component - a bare component
class (as pushed above, with no args), or, for a step that needs args bound
in, a curried component built with the `{{component}}` template helper at
the call site, e.g. from `StepOne`'s own template (`@push` passed down from
`Wizard` above):

```gts
<button {{on "tap" (fn @push (component StepTwo onDone=@onDone) "step-two")}}>
  Next
</button>
```

`PageStackView` renders `<entry.content @isActive={{...}} />` for every entry
ever pushed, `@isActive` true only for the one whose `key` matches
`stack.activeKey`. `pop()` reactivates the previous entry without destroying
either one; `evict(key)` removes an entry for good, so pushing it again later
renders it fresh.

The same tag-name-lookup caveat from
[Sub-routes and back navigation](./frame-outlet#a-caveat-querying-by-tag-name-across-a-stack)
applies here too, for the same underlying reason: every pushed entry stays
mounted, just not all `visible`.

## Animating the transition, via `pageTransition`

Toggling `visibility` directly (as above) swaps pages instantly - there's no
equivalent of `Frame`'s animated push/pop transitions. The `pageTransition`
modifier (`ember-native/modifiers`) gets you the closest approximation
available without touching a `<frame>`'s own navigation/backstack: apply it
in place of the `visibility` binding, on the same element:

```gts
import { pageTransition } from "ember-native/modifiers";

<stack-layout {{pageTransition @isActive}}>
```

Its one positional argument is whether the page should be active/visible,
same sense as `PageStackView`'s `@isActive`. Becoming active fades the page
in from transparent (`opacity` `0` -> `1` over an optional `duration` in ms,
default `200`); becoming inactive collapses it immediately, with no
fade-out. That asymmetry isn't an oversight: fading the outgoing page out too
would require briefly leaving two pages `visible` at once so they can
cross-fade, which a `stack-layout` root can't lay out side by side without
squeezing each into half the space.

Because the fade-in is a real native animation, its completion isn't tracked
by Ember's run loop - `await settled()` (or `click()`/`visit()`, which call
it internally) resolves as soon as the _reactive_ state (routing,
`visibility`) has settled, not once `opacity` has finished animating to `1`.
Assertions against `visibility`/other attributes are unaffected (they're set
synchronously, before the animation starts); if a test needs to assert
against `opacity` itself, poll for the end state instead of assuming
`settled()` covers it.
