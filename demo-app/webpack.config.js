const fs = require('fs');
const path = require('path');
var Module = require('module');
var { fileURLToPath, pathToFileURL } = require('node:url');

Module.registerHooks({
  resolve: (specifier, context, nextResolve) => {
    //do your thing here
    const originalSpecifier = specifier;
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
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        //console.log('failed to resolve', specifier,' from ', parentURL, e);
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
      return nextResolve(specifier, context);
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // console.log('failed to resolve', specifier, e);
    }

    return nextResolve(originalSpecifier, context);
  }
});

const webpack = require('@nativescript/webpack');
const configureEmberNative = require('ember-native/utils/webpack.config.js');
const { execSync } = require("node:child_process");

module.exports = (env) => {
	webpack.init(env);

  process.env.EMBER_HMR_ENABLED = 'true';

	// Learn how to customize:
	// https://docs.nativescript.org/webpack

  // Use ember-native webpack configuration (includes embroider adapter)
  configureEmberNative(webpack);

  webpack.chainWebpack((config) => {
    // Add .gjs and .gts extensions
    config.resolve.extensions.add('.gjs');
    config.resolve.extensions.add('.gts');
    // Test-specific aliases
    // App-specific aliases
    config.resolve.alias.set('~', '/app');
    config.resolve.alias.delete('@');
  });

  // HMR loaders for routes, controllers, templates
  webpack.chainWebpack((config) => {
    config.module
      .rule('gts/gjs')
      .use('hmr-loader')
      .loader(require.resolve('ember-native/utils/hmr-loader.js'))
      .end();

    config.module
      .rule('js/ts')
      .use('hmr-loader')
      .loader(require.resolve('ember-native/utils/hmr-loader.js'))
      .end();

    // Include test XML files
    const testRootXml = path.dirname(path.resolve('./app/tests/test-root-view.xml'));
    config.module.rule('xml').include.add(testRootXml);

    // Include unit-test-runner XML files
    const unitTestRunnerPath = path.dirname(require.resolve('@nativescript/unit-test-runner/package.json'));
    config.module.rule('xml').include.add(unitTestRunnerPath);
    config.module.rule('xml').include.add(fs.realpathSync(unitTestRunnerPath));
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

  // Configure webpack resolveLoader for pnpm
  webpack.chainWebpack((config) => {
    const nativescriptWebpackPath = fs.realpathSync(path.dirname(require.resolve('@nativescript/webpack/package.json')));
    console.log(path.resolve(nativescriptWebpackPath, '..', '..'));
    console.log(fs.readdirSync(path.resolve(nativescriptWebpackPath, '..', '..')));
    console.log(path.resolve(nativescriptWebpackPath, 'dist', 'loaders'))
    console.log(fs.readdirSync(path.resolve(nativescriptWebpackPath, 'dist', 'loaders')));
    config.resolveLoader.modules
      .add(path.resolve(__dirname, 'node_modules'))
      .add(path.resolve(nativescriptWebpackPath, '..', '..'))
      .add(path.resolve(nativescriptWebpackPath, 'dist', 'loaders'))
      .end();
  });

	let conf = webpack.resolveConfig();
  console.log('conf', conf)
  //console.log('module.rules', conf.module.rules.map(r => r.use))

  // Wrap config in async function to run Embroider prebuild
  return (() => {
    try {
      const { emberBuild } = require('@embroider/vite');
      console.log('🔨 Running Embroider prebuild...');
      execSync('pnpm ember build', {
        env: {
          ...process.env,
          EMBROIDER_PREBUILD: 'true',
        }
      })
      console.log('✓ Embroider prebuild completed');
    } catch (e) {
      console.warn('⚠ Embroider prebuild failed:', e?.message || e);
    }
    return conf;
  })();
};
