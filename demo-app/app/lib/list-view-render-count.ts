// Incremented once per `list-view` route's `Page` instantiation - used by
// `demo-app/app/tests/integration/list-view-stack-test.ts` to assert that
// navigating into `list-view.item` and back does not recreate it. Kept in
// its own plain `.ts` module, rather than exported directly from
// `routes/list-view.gts`, because `@nativescript/vite`'s standalone
// TypeScript check can't resolve a `.gts` module from a plain `.ts`
// importer (confirmed via `vite build --mode production`, which is clean on
// `main` but fails on a `.ts` test importing straight from `list-view.gts`).
export let pageConstructCount = 0;

export function incrementPageConstructCount() {
  pageConstructCount++;
}
