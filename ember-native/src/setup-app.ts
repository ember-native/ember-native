import { setup } from './setup.ts';
import DocumentNode from './dom/nodes/DocumentNode.ts';
import { maybeSetupInspectorSupport } from './maybe-setup-inspector-support.ts';

export function setupEmberNativeApp(env: { rootElement: unknown; [key: string]: unknown }) {
  setup();
  (document as unknown as DocumentNode).config = env;

  // See maybe-setup-inspector-support.ts for why this can't be a plain
  // static import or a runtime `if` around the call.
  maybeSetupInspectorSupport(env);

  env.rootElement = DocumentNode.createElement('stack-layout');
}
