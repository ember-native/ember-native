import { getComponentTemplate, setComponentTemplate } from '@ember/component';

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
//
// A standalone `<template>...</template>` expression (as opposed to one
// attached to a class) compiles to an already-complete
// `TemplateOnlyComponent`, not the raw `TemplateFactory` `setComponentTemplate`
// expects - `getComponentTemplate` pulls that factory back out so it can be
// reattached to `Component`'s subclass.
function withTemplateForTest(Component, template) {
  class RenderingTestDouble extends Component {}
  const factory = getComponentTemplate(template);
  if (!factory) {
    throw new Error('withTemplateForTest: could not resolve a template factory from `template`.');
  }
  setComponentTemplate(factory, RenderingTestDouble);
  return RenderingTestDouble;
}

export { withTemplateForTest };
//# sourceMappingURL=with-template-for-testing.js.map
