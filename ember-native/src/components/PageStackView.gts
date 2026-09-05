import Component from '@glimmer/component';
import type PageStack from '../page-stack.ts';

export interface PageStackViewSignature {
  Args: {
    stack: PageStack;
  };
}

// Renders every entry ever pushed onto a `PageStack`, keyed by its stable
// `key` so `{{#each}}` never tears one down once mounted. Each entry is
// invoked with an `@isActive` boolean instead of being wrapped in a
// container this component toggles itself - see `PageStackEntry`'s doc
// comment in `page-stack.ts` for why. It's that boolean, applied by the
// entry's own component, that makes returning to a previously-active entry
// instant instead of a re-render.
export default class PageStackView extends Component<PageStackViewSignature> {
  get entries() {
    const activeKey = this.args.stack.activeKey;
    return this.args.stack.entries.map((entry) => ({
      key: entry.key,
      content: entry.content,
      isActive: entry.key === activeKey,
    }));
  }

  <template>
    {{#each this.entries key='key' as |entry|}}
      <entry.content @isActive={{entry.isActive}} />
    {{/each}}
  </template>
}
