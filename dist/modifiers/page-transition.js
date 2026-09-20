import { modifier } from 'ember-modifier';
import { applyPageTransition } from '../dom/native/page-transition.js';

const DEFAULT_DURATION = 200;

// Whether an element's modifier has already run once - only set on the very
// first call for a given element, so its initial `isActive` state (e.g. the
// first page of the app, or an entry that starts out inactive) is applied
// immediately with no animation.
const mounted = new WeakSet();

/**
 * Fades a `PageStack`/`PageStackOutlet`-managed page in or out instead of
 * `visibility` toggling it instantly - the closest approximation of
 * `Frame`'s animated navigation available without a real `<frame>` (see the
 * "Page stacks" section of the README for why: a `<page>` can only be a
 * direct child of a `<frame>` or the app's own root, and the root is a
 * `stack-layout`, not an overlapping container, so only one page can ever be
 * `visible` at a time - which rules out a true crossfade). Apply it in place
 * of a `visibility={{if isActive 'visible' 'collapse'}}` binding, on the
 * same element:
 *
 * ```gts
 * <page {{pageTransition isChildActive}}>
 * ```
 *
 * Becoming active fades the page in from transparent; becoming inactive
 * collapses it immediately (fading it out too would require briefly leaving
 * two pages `visible` at once, which the `stack-layout` root can't lay out
 * without one squeezing the other).
 */
var pageTransition = modifier((element, [isActive], {
  duration = DEFAULT_DURATION
} = {}) => {
  const nativeView = element.nativeView;
  if (!nativeView) {
    return;
  }
  applyPageTransition(nativeView, isActive, mounted.has(element), duration);
  mounted.add(element);
});

export { pageTransition as default };
//# sourceMappingURL=page-transition.js.map
