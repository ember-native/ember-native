const ContentTag = require('content-tag');

const Preprocessor = new ContentTag.Preprocessor();

module.exports = function (source) {
  return Preprocessor.process(source, {
    inline_source_map: true,
  }).code;
};
