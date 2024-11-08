/// <reference path="./node_modules/@nativescript/types/index.d.ts" />

import DocumentNode from '~/lib/dom/nodes/DocumentNode';

declare global {
  __inspectorSendEvent: any;
  __metadata: any;
  __decorate: any;
  document: DocumentNode
}
