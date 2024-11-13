const webpack = require("@nativescript/webpack");
const fs = require("fs");
const emberWebpack = require('ember-native/utils/webpack.config')
const path = require("path");


module.exports = (env) => {
	webpack.init(env);

	// Learn how to customize:
	// https://docs.nativescript.org/webpack

  webpack.chainWebpack((config) => {
    const glimmerDirs = fs.readdirSync(
      path.resolve(process.cwd(), './node_modules/ember-source/dist/packages/@glimmer')
    );
    for (const glimmerDir of glimmerDirs) {
      console.log(glimmerDir);
      config.resolve.alias.set(
        `@glimmer/${glimmerDir}`,
        `ember-source/dist/packages/@glimmer/${glimmerDir}`,
      );
    }
    // change the "@" alias to "app/libs"
    config.resolve.alias.set('@ember', 'ember-source/dist/packages/@ember');
    config.resolve.alias.set('ember', 'ember-source/dist/packages/ember');
    config.resolve.alias.set(
      '@glimmer/component',
      '@glimmer/component/addon/index.ts',
    );
    config.resolve.alias.set(
      '@glimmer/env',
      require.resolve('ember-native/utils/glimmer-env'),
    );

    config.resolve.alias.set('~', '/app');
  });

  webpack.chainWebpack((config) => {
    // add a new rule for *.something files
    config.module
      .rule('gts/gjs')
      .test(/\.g[jt]s$/)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('gjs-loader')
      .loader(require.resolve('ember-native/utils/content-tag-loader'))
      .end();

    config.module
      .rule('js/ts')
      .test(/\.([jt]s)$/)
      .use('fix-glimmer-content-owner')
      .loader(require.resolve('ember-native/utils/fix-glimmer-content-owner'))
      .end()
      .use('babel-loader')
      .loader('babel-loader');
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

	return webpack.resolveConfig();
};
