
/**
 * Configures webpack for ember-native using @embroider/vite adapter
 *
 * This configuration uses @embroider/vite plugins via the webpack adapter
 * with automatic fallback to custom loaders if unavailable.
 */
module.exports = (webpack) => {
  try {
    const configureAdapter = require('./embroider-webpack-adapter.js');
    configureAdapter(webpack);
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
