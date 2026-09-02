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
    default: [];
  };
}

// Wraps a route's own content (yielded) alongside `{{outlet}}`, toggling
// `visibility` between the two instead of letting the outlet's content
// replace the parent's. Ember never tears down a route's rendered output
// while any of its child routes are active, so the yielded content (e.g. a
// list `<page>`) is already never destroyed by entering a child route
// (e.g. an item detail `<page>`) - this component only makes that state
// visible/hidden correctly, so navigating back to the parent shows it
// instantly instead of appearing to require a re-render.
export default class PageStackOutlet extends Component<PageStackOutletSignature> {
  @service router!: Router;

  get isChildActive(): boolean {
    const current = this.router.currentRouteName;
    const owner = this.args.routeName;
    return !!current && current !== owner && current.startsWith(`${owner}.`);
  }

  <template>
    <stack-layout visibility={{if this.isChildActive 'collapse' 'visible'}}>
      {{yield}}
    </stack-layout>
    <stack-layout visibility={{if this.isChildActive 'visible' 'collapse'}}>
      {{! template-lint-disable no-outlet-outside-routes }}
      {{! This component IS the intended place for a route's child content to
          render, as an alternative to a bare outlet directly in a route
          template - the rule's file-path heuristic can't know that. }}
      {{outlet}}
    </stack-layout>
  </template>
}
