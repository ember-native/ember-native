import { setup } from 'ember-native/setup';
import { setupInspectorSupport } from 'ember-native/setup-inspector-support';
import { ENV } from  '~/config/env';
import DocumentNode from 'ember-native/dom/nodes/DocumentNode';


setup();
(document as unknown as DocumentNode).config = ENV;


setupInspectorSupport(ENV);

ENV.rootElement = DocumentNode.createElement('stack-layout');

