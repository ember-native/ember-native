export interface AnimatableViewLike {
    opacity: number;
    visibility: string;
    animate(options: {
        opacity: number;
        duration: number;
    }): Promise<void> & {
        cancel?: () => void;
    };
}
/**
 * Fades `view` in or collapses it instantly, in place of an instant
 * `visibility` toggle - see `src/modifiers/page-transition.ts` (the modifier
 * that calls this) for why only the "becoming active" half is animated.
 *
 * `isMounted` must be `false` for the very first call for a given view (its
 * initial state is applied directly, with no animation - there's nothing to
 * transition *from* yet) and `true` for every call after that.
 */
export declare function applyPageTransition(view: AnimatableViewLike, isActive: boolean, isMounted: boolean, duration: number): void;
