const fs = require('fs');
const path = require('path');
var Module = require('module');
var { fileURLToPath, pathToFileURL } = require('node:url');

Module.registerHooks({
  resolve: (specifier, context, nextResolve) => {
    //do your thing here
    if(context.parentURL && fileURLToPath(context.parentURL).includes('node:')) return nextResolve(specifier, context);

    if (context.parentURL) {
      const parentURL = fs.realpathSync(fileURLToPath(context.parentURL));
      try {
        const resolved = require.resolve(specifier, { paths: [path.dirname(parentURL)] });
        if (fs.existsSync(resolved)) {
          specifier = fs.realpathSync(resolved);
          if (context.conditions.includes?.('import')) {
            specifier = pathToFileURL(specifier).toString();
          }
        }
        return nextResolve(specifier, context);
      } catch (e) {
        console.log('failed to resolve', specifier,' from ', parentURL, e);
      }
    }
    try {
      const resolved = require.resolve(specifier);
      if (fs.existsSync(resolved)) {
        specifier = fs.realpathSync(resolved);
        if (context.conditions.includes?.('import')) {
          specifier = pathToFileURL(specifier).toString();
        }
      }
    } catch (e) {
      console.log('failed to resolve', specifier, e);
    }

    return nextResolve(specifier, context);
  }
});
const webpack = require('@nativescript/webpack');



module.exports = (env) => {
	webpack.init(env);

  process.env.EMBER_HMR_ENABLED = 'true';

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
        path.resolve(process.cwd(), `./node_modules/ember-source/dist/packages/@glimmer/${glimmerDir}`),
      );
    }

    config.resolve.extensions.add('.gjs');
    config.resolve.extensions.add('.gts');

    config.resolve.alias.set('ember-cli-test-loader/test-support/index', 'ember-cli-test-loader/addon-test-support/index');
    config.resolve.alias.set('@ember/test-helpers', require.resolve('@ember/test-helpers'));
    config.resolve.alias.set('@ember/test-waiters', require.resolve('@ember/test-waiters'));
    config.resolve.alias.set('@ember', path.resolve(process.cwd(), './node_modules/ember-source/dist/packages/@ember'));
    config.resolve.alias.set('ember-testing', path.resolve(process.cwd(), './node_modules/ember-source/dist/packages/ember-testing'));
    config.resolve.alias.set('ember', path.resolve(process.cwd(), './node_modules/ember-source/dist/packages/ember'));
    config.resolve.alias.set(
      '@glimmer/env',
      require.resolve('ember-native/utils/glimmer-env'),
    );

    config.resolve.alias.set('~', '/app');
    config.resolve.alias.delete('@');
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
      .end()
      .use('hmr-loader')
      .loader(require.resolve('ember-native/utils/hmr-loader'))
      .end();

    config.module
      .rule('js/ts')
      .test(/\.([jt]s)$/)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('hmr-loader')
      .loader(require.resolve('ember-native/utils/hmr-loader'))
      .end();

    const testRootXml = path.dirname(path.resolve('./app/tests/test-root-view.xml'));
    config.module.rule('xml').include.add(testRootXml);

    const unitTestsXml = path.dirname(path.resolve('./node_modules/@nativescript/unit-test-runner/app'));
    config.module.rule('xml').include.add(fs.realpathSync(unitTestsXml));
  });

  webpack.chainWebpack((config) => {
    config.plugin('DefinePlugin').tap((args) => {
      Object.assign(args[0], {
        window: 'globalThis',
        __TEST_RUNNER_STAY_OPEN__: !process.env.CI,
        process: {
          browser: true
        }
      });
      console.log('define plugin', args);
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

  webpack.chainWebpack((config) => {
    const fallback = {};
    Object.assign(fallback, {
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "url": require.resolve("url"),
      "querystring": require.resolve("querystring-es3"),
      buffer: require.resolve('buffer'),
      "path": false,
      "tty": false,
      "timers": false,
      "os": false,
      "util": require.resolve("util"),
      "crypto": false,
      "fs": false,
      "tls": false,
      "net": false,
      "zlib": false,
    })
    config.resolve.set('fallback', fallback);
    config.target('node');
  });

	const conf = webpack.resolveConfig();
  console.log('conf', conf)
  return conf;
};
