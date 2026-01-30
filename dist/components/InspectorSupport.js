
import { _ as _defineProperty } from '../_rollupPluginBabelHelpers-ClPBvGFm.js';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@ember/component';

var _InspectorSupport;
const ref = modifier(function setRef(element, [context, key]) {
  // console.log('ref', element, context, key);
  context[key] = element;
});
class InspectorSupport extends Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "setupInspector", () => {
      const i = setInterval(() => {
        const viewInspection = globalThis.EmberInspector?.viewDebug?.viewInspection;
        if (viewInspection && this.tooltip) {
          this.tooltip.querySelector = () => {
            return {
              style: {}
            };
          };
          viewInspection._showTooltip = () => {};
          const _showHighlight = viewInspection._showHighlight;
          viewInspection._hideHighlight = () => {
            this.highlight.setAttribute('visibility', 'collapse');
          };
          viewInspection._showHighlight = (node, rect) => {
            _showHighlight.call(this, node, rect);
            this.highlight.setAttribute('visibility', 'visible');
            const style = this.highlight.style;
            style.width = style.width.value;
            style.height = style.height.value;
            const pos = this.page.nativeView.getLocationInWindow() || {
              x: 0,
              y: 0
            };
            this.highlight.setAttribute('left', Number(style.left.replace('px', '')) - pos.x);
            this.highlight.setAttribute('top', Number(style.top.replace('px', '')) - pos.y);
          };
          viewInspection.highlight = this.highlight;
          viewInspection.tooltip = this.tooltip;
          const id = viewInspection.id;
          viewInspection.highlight.id = `ember-inspector-highlight-${id}`;
          viewInspection.tooltip.id = `ember-inspector-tooltip-${id}`;
          clearInterval(i);
        }
      }, 1000);
    });
    _defineProperty(this, "setupHighlight", modifier(function setupHighlight(element) {
      this.highlight = element;
      this.highlight.setAttribute('visibility', 'collapse');
      this.ownerDocument = element.ownerDocument;
    }.bind(this)));
    _defineProperty(this, "setupTooltip", modifier(function setupTooltip(element) {
      this.tooltip = element;
      this.tooltip.setAttribute('visibility', 'collapse');
    }.bind(this)));
  }
}
_InspectorSupport = InspectorSupport;
setComponentTemplate(precompileTemplate("\n    <absolute-layout {{ref this \"page\"}}>\n      <html-view {{this.setupHighlight}} />\n      <html-view {{this.setupTooltip}} zIndex=\"99\" />\n      {{(this.setupInspector)}}\n      <content-view left=\"0\" top=\"0\" width=\"100%\" height=\"100%\">\n        <frame>\n          {{yield}}\n        </frame>\n      </content-view>\n    </absolute-layout>\n  ", {
  strictMode: true,
  scope: () => ({
    ref
  })
}), _InspectorSupport);

export { InspectorSupport as default };
//# sourceMappingURL=InspectorSupport.js.map
