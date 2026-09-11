import Component from '@glimmer/component';
import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@ember/component';

var _PageStackView;
// Renders every entry ever pushed onto a `PageStack`, keyed by its stable
// `key` so `{{#each}}` never tears one down once mounted. Each entry is
// invoked with an `@isActive` boolean instead of being wrapped in a
// container this component toggles itself - see `PageStackEntry`'s doc
// comment in `page-stack.ts` for why. It's that boolean, applied by the
// entry's own component, that makes returning to a previously-active entry
// instant instead of a re-render.
class PageStackView extends Component {
  get entries() {
    const activeKey = this.args.stack.activeKey;
    return this.args.stack.entries.map(entry => ({
      key: entry.key,
      content: entry.content,
      isActive: entry.key === activeKey
    }));
  }
}
_PageStackView = PageStackView;
setComponentTemplate(precompileTemplate("{{#each this.entries key=\"key\" as |entry|}}\n  <entry.content @isActive={{entry.isActive}} />\n{{/each}}", {
  strictMode: true
}), _PageStackView);

export { PageStackView as default };
//# sourceMappingURL=PageStackView.js.map
