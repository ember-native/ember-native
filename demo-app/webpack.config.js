const fs = require('fs');
const path = require('path');

const webpack = require('@nativescript/webpack');
const configureEmberNative = require('ember-native/utils/webpack.config.js');
const { execSync } = require('node:child_process');

// This config is only used for `nativescript test android` (via
// nativescript.test.config.ts's `bundlerConfigPath`). The main
// `build`/`debug android` flow uses vite.config.ts instead - see
// VITE_MIGRATION_NOTES.md for why @nativescript/unit-test-runner still
// needs webpack.
module.exports = (env) => {
  // @nativescript/webpack (5.x) defaults to emitting an ESM bundle
  // (.mjs chunks) for android/ios now that @nativescript/core (9.x) ships
  // as "type": "module". The Android build toolchain's Static Binding
  // Generator (js_parser.js, shipped inside @nativescript/android) does
  // not understand .mjs bundle output and silently produces zero parsed
  // files, which then fails the Gradle build with a missing
  // sbg-bindings.txt error. Opting back into the CommonJS bundle output
  // keeps the native build tooling working; this is a supported flag on
  // the @nativescript/webpack config, not a hack around it.
  env.commonjs = true;

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
    config.resolveLoader.modules
      .add(path.resolve(__dirname, 'node_modules'))
      .add(path.resolve(nativescriptWebpackPath, '..', '..'))
      .add(path.resolve(nativescriptWebpackPath, 'dist', 'loaders'))
      .end();
  });

  const conf = webpack.resolveConfig();

  // @embroider/vite's resolver (bridged into webpack by
  // ember-native/utils/embroider-webpack-adapter.js) reads Embroider's
  // compat-build output (app-files manifest, virtual re-exports, etc.) from
  // disk rather than generating it on the fly the way its real Vite/Rollup
  // plugins do. Force a synchronous `ember build` first so that output
  // exists before webpack starts resolving modules against it.
  try {
    require('@embroider/vite');
    execSync('pnpm ember build', {
      env: {
        ...process.env,
        EMBROIDER_PREBUILD: 'true',
      },
      stdio: 'inherit',
    });
  } catch (e) {
    console.warn('⚠ Embroider prebuild failed:', e?.message || e);
  }

  return conf;
};
