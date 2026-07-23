/**
 * Configures webpack for ember-native using @embroider/vite adapter
 *
 * This configuration uses @embroider/vite plugins via the webpack adapter
 * with automatic fallback to custom loaders if unavailable.
 *
 * @param {object} webpack - the @nativescript/webpack instance
 * @param {object} [options] - optional configuration
 * @param {string[]} [options.virtualModules] - additional virtual module paths
 *   to register alongside ember-native's built-in ones.
 */
module.exports = (webpack, options = {}) => {
  try {
    const configureAdapter = require('./embroider-webpack-adapter.js');
    configureAdapter(webpack, options);
    console.log('✓ Using @embroider/vite webpack adapter');
  } catch (e) {
    console.warn('⚠ Failed to load embroider adapter, using fallback loaders:', e.message);
  }

  // Configure @glimmer/env alias (still needed)
  webpack.chainWebpack((config) => {
    config.resolve.alias.set(
      '@glimmer/env',
      require.resolve('./glimmer-env.js'),
    );
  });

  // Something in this resolution graph (most likely Embroider's custom
  // resolver plugin, which is built around ESM/Vite-style resolution)
  // ends up classifying plain CommonJS `.js` files pulled in from
  // node_modules as `javascript/esm` even though they contain zero
  // `import`/`export` syntax. Webpack then treats their internal
  // `require('./sibling')` calls as opaque runtime calls instead of
  // rewriting them to `__webpack_require__`, since the ESM parser doesn't
  // hook CommonJS require handling. Nothing gets bundled and nothing
  // errors at build time either (the call is just an ordinary, uninteresting
  // CallExpression to the ESM parser) - it only surfaces on-device as
  // "Failed to find module: './x', relative to: app/". This has hit
  // `acorn`/`css-what` (both consumed by @nativescript/core) and
  // `source-map-js` (pulled in transitively by css-tree, the default
  // Android/iOS CSS parser). Forcing `javascript/auto` on those specific
  // files restores webpack's normal CommonJS-or-ESM content-sniffing
  // instead of whatever is overriding it. This is intentionally scoped to
  // just these packages rather than all of node_modules: @nativescript/core
  // itself relies on genuine ESM side-effect-import ordering (see
  // globals/index.js / bundle-entry-points.js) that a blanket
  // `javascript/auto` override was observed to break.
  webpack.chainWebpack((config) => {
    config.module
      .rule('acorn-cjs')
      .test(/[/\\]acorn[/\\]dist[/\\]acorn\.js$/)
      .type('javascript/auto');
    config.module
      .rule('css-what-cjs')
      .test(/[/\\]css-what[/\\]dist[/\\]commonjs[/\\].*\.js$/)
      .type('javascript/auto');
    config.module
      .rule('source-map-js-cjs')
      .test(/[/\\]source-map-js[/\\]lib[/\\].*\.js$/)
      .type('javascript/auto');
  });

  webpack.chainWebpack((config) => {
    config.plugin('DefinePlugin').tap((args) => {
      Object.assign(args[0], {
        window: 'globalThis',
      });
      return args;
    });
  });

  webpack.chainWebpack((config) => {
    config.externals(
      // make sure to keep pre-defined externals
      config.get('externals').concat([
        // add your own externals
        { 'ember-compatibility-helpers': 'global globalThis' },
      ]),
    );
  });
};
