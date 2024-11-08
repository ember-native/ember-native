import { setup } from 'ember-native/setup';
import { setupInspectorSupport } from 'ember-native/setup-inspector-support';
import { ENV } from  './env';
import DocumentNode from 'ember-native/dom/nodes/DocumentNode';

globalThis.window = globalThis;
globalThis.document = new DocumentNode() as unknown as Document;
(globalThis.document as unknown as DocumentNode).config = ENV;
setup(ENV);
setupInspectorSupport(ENV);

ENV.rootElement = DocumentNode.createElement('stack-layout');

