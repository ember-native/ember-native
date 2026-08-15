import { setComponentTemplate } from '@ember/component';
import type { TemplateOnlyComponent } from '@ember/component/template-only';
import type { TemplateFactory } from '@glimmer/interfaces';

// A `<page>` only gets a working `.frame`/ActionBar when it is a direct
// native child of a `<frame>` element (see `dom/native/FrameElement.ts`) -
// `setupRenderingTest` never provides one, so rendering a component whose
// template is rooted at `<page>` crashes with
// `TypeError: page.frame._getNavBarVisible is not a function` the moment an
// `<action-bar>` loads. Glimmer templates are compiled statically, so a
// component's real template can't be introspected/stripped at runtime -
// `setComponentTemplate` is the supported way to swap in a test-only
// template (e.g. the same content with the `<page>`/`<action-bar>` wrapper
// removed) while keeping the original class's services, args, and lifecycle.
export function withTemplateForTest<
  T extends abstract new (...args: never[]) => object,
>(Component: T, template: TemplateOnlyComponent<unknown>): T {
  class RenderingTestDouble extends (Component as unknown as new (...args: never[]) => object) {}
  setComponentTemplate(template as unknown as TemplateFactory, RenderingTestDouble);
  return RenderingTestDouble as unknown as T;
}
