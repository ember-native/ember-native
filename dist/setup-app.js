import { setup } from './setup.js';
import DocumentNode from './dom/nodes/DocumentNode.js';
import { maybeSetupInspectorSupport } from './maybe-setup-inspector-support.js';

function setupEmberNativeApp(env) {
  setup();
  document.config = env;

  // See maybe-setup-inspector-support.ts for why this can't be a plain
  // static import or a runtime `if` around the call.
  maybeSetupInspectorSupport(env);
  env.rootElement = DocumentNode.createElement('stack-layout');
}

export { setupEmberNativeApp };
//# sourceMappingURL=setup-app.js.map
