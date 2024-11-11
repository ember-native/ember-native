import { setup } from 'ember-native/setup';
import { setupInspectorSupport } from 'ember-native/setup-inspector-support';
import { ENV } from  '../config/env';
import DocumentNode from 'ember-native/dom/nodes/DocumentNode';

// @ts-ignore
globalThis.window = globalThis;
globalThis.document = new DocumentNode() as unknown as Document;
(globalThis.document as unknown as DocumentNode).config = ENV;
setup();
setupInspectorSupport(ENV);

// @ts-ignore
ENV.rootElement = DocumentNode.createElement('stack-layout');

