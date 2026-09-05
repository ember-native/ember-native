// Tracks each view's in-flight fade-in `Animation`, keyed by the view
// instance, so a rapid active -> inactive -> active re-trigger cancels the
// still-running previous fade-in instead of leaving two `animate()` calls
// driving the same `opacity` property concurrently.
const inFlightAnimations = new WeakMap();

/**
 * Fades `view` in or collapses it instantly, in place of an instant
 * `visibility` toggle - see `src/modifiers/page-transition.ts` (the modifier
 * that calls this) for why only the "becoming active" half is animated.
 *
 * `isMounted` must be `false` for the very first call for a given view (its
 * initial state is applied directly, with no animation - there's nothing to
 * transition *from* yet) and `true` for every call after that.
 */
function applyPageTransition(view, isActive, isMounted, duration) {
  if (!isMounted) {
    view.opacity = 1;
    view.visibility = isActive ? 'visible' : 'collapse';
    return;
  }
  inFlightAnimations.get(view)?.cancel?.();
  inFlightAnimations.delete(view);
  if (isActive) {
    view.opacity = 0;
    view.visibility = 'visible';
    const animation = view.animate({
      opacity: 1,
      duration
    });
    inFlightAnimations.set(view, animation);
    animation.then(() => {
      // Only clear the entry if it's still this animation - a later
      // activation may have already replaced it with a newer one.
      if (inFlightAnimations.get(view) === animation) {
        inFlightAnimations.delete(view);
      }
    }).catch(() => {});
  } else {
    view.visibility = 'collapse';
  }
}

export { applyPageTransition };
//# sourceMappingURL=page-transition.js.map
