'use strict';

const path = require('path');
const fs = require('fs');
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = async function (defaults) {
  const app = new EmberApp(defaults, {
    addons: {
      exclude: ['ember-native'],
    },
    'ember-cli-babel': {
      enableTypeScriptTransform: true,
      disableDecoratorTransforms: true,
    },
    babel: {
      plugins: [
        // add the new transform.
        // require.resolve('decorator-transforms'),
      ],
    },
  });

  return require('@embroider/compat').prebuild(app, {
    staticAppPaths: [
      'components/ember-native',
      'instance-initializers/ember-native',
      'services/ember-native',
    ],
  });
  //
  // const { kolay } = await import('kolay/webpack');
  //
  // const { Webpack } = require('@embroider/webpack');
  //
  // return require('@embroider/compat').prebuild(app, null, {
  //   extraPublicTrees: [],
  //   staticAddonTrees: true,
  //   staticAddonTestSupportTrees: true,
  //   staticHelpers: true,
  //   staticModifiers: true,
  //   staticComponents: true,
  //   // ember-inspector does not work with this flag
  //   // staticEmberSource: true,
  //   packagerOptions: {
  //     webpackConfig: {
  //       devtool: 'source-map',
  //       resolve: {
  //         alias: {
  //           path: 'path-browserify',
  //         },
  //         fallback: {
  //           path: require.resolve('path-browserify'),
  //           assert: require.resolve('assert'),
  //           fs: false,
  //         },
  //       },
  //       node: {
  //         global: false,
  //         __filename: true,
  //         __dirname: true,
  //       },
  //       plugins: [
  //         kolay({
  //           src: 'public/docs',
  //           packages: ['ember-native'],
  //         }),
  //       ],
  //       module: {
  //         rules: [
  //           {
  //             test: /\.(woff|woff2|eot|ttf|otf)$/,
  //             use: ['file-loader'],
  //           },
  //           {
  //             test: /\.svg$/,
  //             loader: 'svg-inline-loader'
  //           },
  //           {
  //             test: /.css$/i,
  //             use: [
  //               {
  //                 loader: 'postcss-loader',
  //                 options: {
  //                   postcssOptions: {
  //                     config: 'config/postcss.config.js',
  //                   },
  //                 },
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //     },
  //   },
  // });
};
