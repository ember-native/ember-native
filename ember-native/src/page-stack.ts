import { tracked } from '@glimmer/tracking';
import type { ComponentLike } from '@glint/template';

let nextKey = 0;

export interface PageStackEntry {
  key: string | number;
  // A renderable value - typically a curried component obtained from the
  // `component` helper (e.g. `(component DetailPage item=item)`), so it can
  // be invoked in a template as `<entry.content />` with its args already
  // bound. Rendered by `PageStackView`, which invokes it with an `@isActive`
  // boolean - the component is responsible for applying it as its own root
  // element's `visibility` (e.g. `visibility={{if @isActive 'visible'
  // 'collapse'}}`). `PageStackView` deliberately doesn't wrap entries in a
  // container of its own to toggle for them: a `<page>` can only be a
  // direct child of a `<frame>` (or the app's own root), so wrapping one
  // here would crash at runtime ("Page can only be nested inside Frame").
  content: ComponentLike<{ Args: { isActive: boolean } }>;
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
  @tracked entries: PageStackEntry[] = [];
  @tracked activeKey: PageStackEntry['key'] | null = null;

  get activeIndex(): number {
    return this.entries.findIndex((entry) => entry.key === this.activeKey);
  }

  /** Pushes (or, if `key` is already present, reactivates) an entry. */
  push(
    content: PageStackEntry['content'],
    key: PageStackEntry['key'] = nextKey++,
  ) {
    if (!this.entries.some((entry) => entry.key === key)) {
      this.entries = [...this.entries, { key, content }];
    }
    this.activeKey = key;
    return key;
  }

  /** Activates the entry just below the current one, if any. Does not evict either. */
  pop(): boolean {
    const index = this.activeIndex;
    if (index <= 0) {
      return false;
    }
    this.activeKey = this.entries[index - 1]!.key;
    return true;
  }

  /** Activates an already-pushed entry directly, without disturbing the rest of the stack. */
  goTo(key: PageStackEntry['key']): boolean {
    if (!this.entries.some((entry) => entry.key === key)) {
      return false;
    }
    this.activeKey = key;
    return true;
  }

  /** Discards a cached entry entirely - pushing it again later renders it fresh. */
  evict(key: PageStackEntry['key']) {
    this.entries = this.entries.filter((entry) => entry.key !== key);
    if (this.activeKey === key) {
      this.activeKey = this.entries.at(-1)?.key ?? null;
    }
  }
}
