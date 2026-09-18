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
declare const _default: import("ember-modifier").FunctionBasedModifier<{
    Element: import("../index.ts").NativeElementNode<import("@nativescript/core").ViewBase>;
    Args: {
        Named: {
            duration?: number;
        };
        Positional: [isActive: boolean];
    };
}>;
export default _default;
