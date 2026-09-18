import type { ComponentLike } from '@glint/template';
export interface PageStackEntry {
    key: string | number;
    content: ComponentLike<{
        Args: {
            isActive: boolean;
        };
    }>;
}
/**
 * A stack of entries that, once pushed, stay mounted (rendered by
 * `PageStackView`) until explicitly evicted - only `activeKey` changes when
 * navigating back and forth, so returning to a previous entry shows it
 * instantly instead of re-rendering it. This is the same "don't recreate a
 * screen you've already visited" behavior NativeScript's own `Frame`
 * backstack gives natively, made available here for navigation that isn't
 * driven by the Ember router - see `PageStackOutlet` for router-driven
 * sub-route stacking, which relies on Ember's own outlet lifecycle instead
 * of this class.
 */
export default class PageStack {
    entries: PageStackEntry[];
    activeKey: PageStackEntry['key'] | null;
    get activeIndex(): number;
    /** Pushes (or, if `key` is already present, reactivates) an entry. */
    push(content: PageStackEntry['content'], key?: PageStackEntry['key']): string | number;
    /** Activates the entry just below the current one, if any. Does not evict either. */
    pop(): boolean;
    /** Activates an already-pushed entry directly, without disturbing the rest of the stack. */
    goTo(key: PageStackEntry['key']): boolean;
    /** Discards a cached entry entirely - pushing it again later renders it fresh. */
    evict(key: PageStackEntry['key']): void;
}
