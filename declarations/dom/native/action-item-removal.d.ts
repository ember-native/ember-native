export interface ActionItemsLike<Item> {
    getItems(): Item[];
    removeItem(item: Item): void;
}
export interface ActionBarLike<Item> {
    actionItems: ActionItemsLike<Item>;
    _removeView(item: Item): void;
}
/**
 * NativeScript's ActionBar keeps its own bookkeeping for action items
 * (ActionItems._items) separate from the generic view-child tree - it's
 * populated and depopulated only via ActionItems.addItem()/removeItem().
 * Removing an <action-item> through the generic View._removeView() path
 * (what every other kind of child uses) never touches that bookkeeping, so
 * the item stays registered forever and the ActionBar - which rebuilds its
 * whole menu from ActionItems.getVisibleItems() on every update() - keeps
 * re-rendering it, duplicating on every subsequent re-add.
 *
 * Route the removal through actionItems.removeItem() whenever the item is
 * actually registered there; fall back to _removeView() for anything an
 * ActionBar hosts without going through ActionItems (e.g. a
 * NavigationButton, which ActionBarBase's own navigationButton setter
 * manages separately).
 */
export declare function removeActionBarChild<Item>(actionBar: ActionBarLike<Item>, childView: Item): void;
