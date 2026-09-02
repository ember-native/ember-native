import Component from '@glimmer/component';
import { service } from '@ember/service';
import type Router from '@ember/routing/router';

export interface PageStackOutletSignature {
  Args: {
    // The name of the route rendering this component, e.g. `'list-view'` for
    // `routes/list-view.gts`. Used to tell whether one of its child routes
    // (e.g. `'list-view.item'`) is currently active.
    routeName: string;
  };
  Blocks: {
    // `isChildActive` - apply it as the `visibility` of your own `<page>`
    // directly (e.g. `visibility={{if isChildActive 'collapse' 'visible'}}`).
    // This component deliberately renders no native element of its own: a
    // `<page>` can only be a direct child of a `<frame>` (or the app's own
    // root) - wrapping it in a container here to toggle its visibility
    // would break that and crash at runtime ("Page can only be nested
    // inside Frame").
    default: [isChildActive: boolean];
  };
}

// Yields whether one of `@routeName`'s child routes is currently active,
// alongside `{{outlet}}`. Ember never tears down a route's rendered output
// while any of its child routes are active, so the yielded content (e.g. a
// list `<page>`) is already never destroyed by entering a child route (e.g.
// an item detail `<page>`) - toggling its own `visibility` off that boolean
// is all that's needed to make that state visible/hidden correctly, so
// navigating back to the parent shows it instantly instead of appearing to
// require a re-render.
export default class PageStackOutlet extends Component<PageStackOutletSignature> {
  @service router!: Router;

  get isChildActive(): boolean {
    const current = this.router.currentRouteName;
    const owner = this.args.routeName;
    // A route with children (like `@routeName` here) gets an implicit
    // `<owner>.index` route of its own - visiting `owner`'s own URL with no
    // further path resolves `currentRouteName` to that, not to `owner`. It
    // isn't a "real" child route rendering anything of its own, so treat it
    // the same as being on `owner` directly.
    if (!current || current === owner || current === `${owner}.index`) {
      return false;
    }
    return current.startsWith(`${owner}.`);
  }

  <template>
    {{yield this.isChildActive}}
    {{! template-lint-disable no-outlet-outside-routes }}
    {{! This component IS the intended place for a route's child content to
        render, as an alternative to a bare outlet directly in a route
        template - the rule's file-path heuristic can't know that. }}
    {{outlet}}
  </template>
}
