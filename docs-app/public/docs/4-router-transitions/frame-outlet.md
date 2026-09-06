# Sub-routes and back navigation

## Why a bare `{{outlet}}` doesn't work here

Ember never tears down a route's rendered output while any of its child
routes are active - the parent route's own component simply isn't destroyed
by entering a child route. A `<page>` can only ever be a direct child of a
`<frame>` though, so a bare `{{outlet}}` placed _inside_ a route's own
`<page>` would nest a child route's `<page>` inside it instead, which
NativeScript rejects at runtime with `Page can only be nested inside Frame`.

`FrameOutlet` (`ember-native/components`) renders its block (the route's own
`<page>`) and `{{outlet}}` (a child route's `<page>`, if one is active) as
siblings instead, so both land as direct children of the enclosing `<frame>`,
in route-depth order:

```gts
// routes/list-view.gts
import { FrameOutlet } from "ember-native/components";

class Page extends Component {
  <template>
    <FrameOutlet>
      <page id="list-view-page">
        {{! ...the list-view route's own content... }}
      </page>
    </FrameOutlet>
  </template>
}
```

```gts
// routes/list-view/item.gts - a child route of `list-view` above
class Page extends Component {
  <template>
    <page id="item-page">
      {{! ...the item detail route's own content, including its own back
           button wired to the `history` service (see below)... }}
    </page>
  </template>
}
```

Neither page needs any visibility handling of its own - navigating into
`list-view.item` pushes `item-page` onto the real backstack (animated by
whatever transition [`NativeRouter#transitionTo`](./) staged); navigating
back pops it and shows the exact same `list-view-page` instance, laid out
exactly as NativeScript left it. This composes for arbitrarily deep nesting:
if `list-view.item` itself wraps its own content in another `FrameOutlet`, a
further child route stacks on top of it the same way.

## Navigating back, via `history`

`HistoryService` (`ember-native/history`) pairs with `native-router` to make
back navigation symmetrical with the transition you pushed forward with - it
pops its own stack of visited URLs and replays whichever `backTransition` was
staged for the current entry, so a route generally only needs to call
`nativeRouter.transitionTo(...)` on the way in and `history.back()` on the
way out:

```gts
import { on } from "@ember/modifier";
import { service } from "@ember/service";
import Component from "@glimmer/component";
import type HistoryService from "ember-native/services/history";

class Page extends Component {
  @service("ember-native/history") history!: HistoryService;

  <template>
    <page id="item-page">
      <action-bar title="Item">
        <navigation-button
          {{on "tap" this.history.back}}
          visibility="{{if this.history.stack.length 'visible' 'collapse'}}"
          android.position="left"
          text="Go back"
          android.systemIcon="ic_menu_back"
        />
      </action-bar>
      {{! ... }}
    </page>
  </template>
}
```

`history.stack.length` is a convenient guard for hiding the back button on
whichever page has nothing to go back to.

`HistoryService` also handles Android's hardware back key and iOS's edge
swipe-back gesture, keeping Ember's router (and its own stack) in sync with
whatever native navigation the platform already did - you don't need to wire
either of those up yourself.

## A caveat: querying by tag name across a stack

Once more than one page has been pushed, `document`/element lookups that
search the whole tree by tag (e.g. `document.getElementByTagName("action-bar")`)
can match a backstacked page's element instead of the currently-shown one: a
backstacked `<page>` stays a real child of `<frame>` even though NativeScript
isn't currently displaying it. Prefer `getElementById` scoped to a known page
(give each stacked `<page>` a distinct `id`, as above) over a blanket tag
search.
