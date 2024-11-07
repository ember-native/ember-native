import Component from "@glimmer/component";
import { modifier } from 'ember-modifier';
import type ElementNode from "../dom/nodes/ElementNode";
import ViewNode from '../dom/nodes/ViewNode.ts';
import NativeElementNode from '../dom/native/NativeElementNode.ts';
import DocumentNode from '../dom/nodes/DocumentNode.ts';

const ref = modifier(function setRef(element: any, [context, key]: any) {
  // console.log('ref', element, context, key);
  context[key] = element;
})


interface InspectorSupportInterface {
  Args: {};
  Blocks: {
    default: []
  }
}


export default class InspectorSupport extends Component<InspectorSupportInterface> {
  declare highlight: ElementNode;
  declare tooltip: ElementNode;
  declare page: ElementNode;
  declare ownerDocument: DocumentNode;
  setupInspector = () => {
    let i = setInterval(() => {
      const viewInspection = globalThis.EmberInspector?.viewDebug?.viewInspection;
      if (viewInspection) {
        this.tooltip.querySelector = () => {
          return {
            style: {}
          }
        }
        viewInspection._showTooltip = (_node: any, _rect: any) => {

        }
        const _showHighlight = viewInspection._showHighlight;
        viewInspection._hideHighlight = () => {
          this.highlight.setAttribute('visibility', 'collapse');
        }
        viewInspection._showHighlight = (node: ViewNode, rect: any) => {
          _showHighlight.call(this, node, rect);
          this.highlight.setAttribute('visibility', 'visible');
          const style = this.highlight.style;
          this.highlight.style.width = (this.highlight.style.width as any).value;
          this.highlight.style.height = (this.highlight.style.height as any).value;
          const pos = this.page.nativeView.getLocationInWindow() || {
            x: 0,
            y: 0
          };
          this.highlight.setAttribute('left', Number(style.left!.replace('px', '')) - pos.x);
          this.highlight.setAttribute('top', Number(style.top!.replace('px', '')) - pos.y);
        }
        viewInspection.highlight = this.highlight;
        viewInspection.tooltip = this.tooltip;
        const id = viewInspection.id;

        viewInspection.highlight.id = `ember-inspector-highlight-${id}`;
        viewInspection.tooltip.id = `ember-inspector-tooltip-${id}`;
        clearInterval(i);
      }
    }, 1000);
  }

  setupHighlight = modifier(function setupHighlight(this: InspectorSupport, element: NativeElementNode) {
    this.highlight = element;
    this.highlight.setAttribute('visibility', 'collapse');
    this.ownerDocument = element.ownerDocument!;
  }.bind(this));
  setupTooltip = modifier(function setupTooltip(this: InspectorSupport, element: NativeElementNode) {
    this.tooltip = element;
    this.tooltip.setAttribute('visibility', 'collapse');
  }.bind(this));
  <template>
    <absolute-layout {{ref this 'page'}}>
      <html-view {{this.setupHighlight}} />
      <html-view {{this.setupTooltip}} zIndex=99 />
      {{(this.setupInspector)}}
      <content-view left="0" top="0" width="100%" height="100%">
        <frame>
          {{yield}}
        </frame>
      </content-view>
    </absolute-layout>
  </template>
}
