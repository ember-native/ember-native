const { patches } = require('./webpack-dependency-patches.js');

/**
 * Applies the matching text replacement from `webpack-dependency-patches.js`
 * to whichever dependency file webpack routed through this loader.
 *
 * @this {import('webpack').LoaderContext<{}>}
 * @param {string} source
 */
module.exports = function emberNativeDependencyPatchesLoader(source) {
  const patch = patches.find((p) => p.match.test(this.resourcePath));
  if (!patch) {
    return source;
  }
  if (!source.includes(patch.from)) {
    throw new Error(
      `ember-native: dependency patch for ${this.resourcePath} no longer applies - ` +
        `expected to find:\n${patch.from}\nUpdate ember-native/utils/webpack-dependency-patches.js.`,
    );
  }
  return source.replace(patch.from, patch.to);
};
