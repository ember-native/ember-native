import Component from '@glimmer/component';
import type PageStack from '../page-stack.ts';

export interface PageStackViewSignature {
  Args: {
    stack: PageStack;
  };
}

// Renders every entry ever pushed onto a `PageStack`, keyed by its stable
// `key` so `{{#each}}` never tears one down once mounted - only the
// `visibility` of its wrapper toggles between entries, which is what makes
// returning to a previously-active entry instant instead of a re-render.
export default class PageStackView extends Component<PageStackViewSignature> {
  get entries() {
    const activeKey = this.args.stack.activeKey;
    return this.args.stack.entries.map((entry) => ({
      key: entry.key,
      content: entry.content,
      visible: entry.key === activeKey,
    }));
  }

  <template>
    {{#each this.entries key='key' as |entry|}}
      <stack-layout visibility={{if entry.visible 'visible' 'collapse'}}>
        <entry.content />
      </stack-layout>
    {{/each}}
  </template>
}
