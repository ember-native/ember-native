// Stub for source-map-js/lib/source-map-generator.js
// NativeScript cannot resolve the relative './base64-vlq' require at runtime.
// css-tree loads this unconditionally but source map *generation* is not
// needed in a NativeScript (native mobile) environment.

'use strict';

class SourceMapGenerator {
  constructor() {}
  addMapping() {}
  setSourceContent() {}
  toString() { return ''; }
  toJSON() { return {}; }
}

module.exports = { SourceMapGenerator };
