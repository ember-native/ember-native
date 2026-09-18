/**
 * Wires up Chrome DevTools protocol support in dev builds only, tree-shaken
 * out of release builds entirely.
 *
 * `./setup-inspector-support.ts` statically imports
 * `@nativescript/core/debugger/webinspector-dom`, and that module applies a
 * `@DomainDispatcher('DOM')` decorator to a class at its own top level,
 * immediately calling a `__registerDomainDispatcher` global that only the
 * "-with-inspector" Android runtime variant provides - NativeScript's
 * *release* builds intentionally use the plain runtime instead, so this
 * throws a `ReferenceError` the moment the module is loaded, aborting app
 * boot with a generic, cause-less "Module evaluation promise rejected" error,
 * on every release build (see VITE_MIGRATION_NOTES.md). A plain runtime `if`
 * around the *call* doesn't help, because ES import hoisting means the
 * *import* already ran, unconditionally, by the time any runtime check could
 * run. `import.meta.env.DEV` is a build-time constant Vite substitutes
 * before tree-shaking, so unlike a runtime condition this one lets Rollup
 * prove the branch (and everything only reachable through it, including the
 * import) is dead code in a production build, and removes it from the bundle
 * entirely instead of merely deferring it.
 *
 * Call this instead of importing `setup-inspector-support.ts` directly -
 * that module's own `setupInspectorSupport` export is only safe to use
 * behind this exact `import.meta.env.DEV`-gated dynamic-import pattern, and
 * a plain static or unconditional import of it will crash every release
 * build the moment that module is loaded.
 */
function maybeSetupInspectorSupport(config) {
  if (import.meta.env.DEV) {
    import('./setup-inspector-support.js').then(({
      setupInspectorSupport
    }) => {
      try {
        setupInspectorSupport(config);
      } catch (e) {
        console.error('[ember-native] setupInspectorSupport failed, devtools support will be unavailable:', e);
      }
    });
  }
}

export { maybeSetupInspectorSupport };
//# sourceMappingURL=maybe-setup-inspector-support.js.map
