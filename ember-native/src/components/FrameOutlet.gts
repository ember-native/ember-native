import type { TOC } from '@ember/component/template-only';

export interface FrameOutletSignature {
  Blocks: {
    default: [];
  };
}

// A `<page>` can only be a direct child of a `<frame>` (or the app's own
// root) - `FrameElement` relies on that to read its `childNodes` as an
// ordered page stack (see its class doc comment). Placing `{{outlet}}`
// *inside* a route's own `<page>` would nest a child route's `<page>`
// inside this one instead, which NativeScript rejects at runtime ("Page
// can only be nested inside Frame").
//
// `FrameOutlet` renders its block (a route's own `<page>`) and `{{outlet}}`
// (a child route's `<page>`, if one is active) as siblings instead, so both
// land as direct children of the enclosing `<frame>` in route-depth order.
// Use it as the wrapper for any route template that has child routes:
//
// ```gts
// <template>
//   <FrameOutlet>
//     <page id='list-view-page'>...</page>
//   </FrameOutlet>
// </template>
// ```
//
// Ember already keeps this route's own rendered output (and so its
// `<page>`) mounted for as long as any child route is active -
// `FrameElement` takes it from there, navigating the real `Frame` backstack
// to match instead of anything here needing to toggle visibility.
const FrameOutlet: TOC<FrameOutletSignature> = <template>
  {{yield}}
  {{! template-lint-disable no-outlet-outside-routes }}
  {{! This component IS the intended place for a route's child content to
      render, as an alternative to a bare outlet directly in a route
      template - the rule's file-path heuristic can't know that. }}
  {{outlet}}
</template>;

export default FrameOutlet;
