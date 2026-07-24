import { setup } from 'ember-native/setup';
import { ENV } from  '~/config/env';
import DocumentNode from 'ember-native/dom/nodes/DocumentNode';


setup();
(document as unknown as DocumentNode).config = ENV;

// Wiring up Chrome DevTools protocol support is a pure dev-tooling
// convenience, and `import.meta.env.DEV` must gate the *import*, not just
// the call: `ember-native/setup-inspector-support` statically imports
// `@nativescript/core/debugger/webinspector-dom`, and that module applies a
// `@DomainDispatcher('DOM')` decorator to a class at its own top level,
// immediately calling a `__registerDomainDispatcher` global that only the
// "-with-inspector" Android runtime variant provides - NativeScript's
// *release* builds intentionally use the plain runtime instead, so this
// throws a `ReferenceError` the moment the module is loaded, aborting app
// boot with a generic, cause-less "Module evaluation promise rejected"
// error, on every release build (see VITE_MIGRATION_NOTES.md). A plain
// runtime `if` around the *call* (tried first) doesn't help, because ES
// import hoisting means the *import* already ran, unconditionally, by the
// time any runtime check could run. `import.meta.env.DEV` is a build-time
// constant Vite substitutes before tree-shaking, so unlike a runtime
// condition this one lets Rollup prove the branch (and everything only
// reachable through it, including the import) is dead code in a production
// build, and removes it from the bundle entirely instead of merely
// deferring it.
if (import.meta.env.DEV) {
  import('ember-native/setup-inspector-support').then(({ setupInspectorSupport }) => {
    try {
      setupInspectorSupport(ENV);
    } catch (e) {
      console.error('[ember-native] setupInspectorSupport failed, devtools support will be unavailable:', e);
    }
  });
}

ENV.rootElement = DocumentNode.createElement('stack-layout');

