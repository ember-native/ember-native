/**
 * Webpack loader that uses @embroider/vite's templateTag plugin
 * to transform .gts/.gjs files
 */

let templateTagPlugin;

try {
  const { templateTag } = require('@embroider/vite');
  templateTagPlugin = templateTag();
} catch (e) {
  console.warn('Failed to load @embroider/vite templateTag plugin:', e.message);
  console.warn('Falling back to content-tag-loader');
  // Fallback to content-tag-loader
  module.exports = require('./content-tag-loader.js');
  return;
}

module.exports = function embroiderTemplateTagLoader(source) {
  const callback = this.async();
  const id = this.resourcePath;

  // Create a minimal context for the plugin
  const context = {
    parse: (code) => ({ code }),
  };

  // Call the transform hook from the templateTag plugin
  Promise.resolve()
    .then(() => {
      if (templateTagPlugin.transform) {
        return templateTagPlugin.transform.call(context, source, id);
      }
      return null;
    })
    .then((result) => {
      if (result && result.code) {
        // Return just the code, like content-tag-loader does
        // This avoids the .inputSourceMap error with babel-loader
        callback(null, result.code);
      } else {
        // If no transformation, pass through
        callback();
      }
    })
    .catch((error) => {
      console.error('Template tag transformation error:', error);
      callback(error);
    });
};
