const fs = require('fs');
const path = require('path');


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
      "url": false,
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

  // Fix ESM module resolution for acorn and css-what
  webpack.chainWebpack((config) => {
    // Handle .mjs files
    config.module
      .rule('mjs')
      .test(/\.mjs$/)
      .include.add(/node_modules/)
      .end()
      .type('javascript/auto');

    // Force css-what CommonJS dist to be treated as CJS (not ESM),
    // because the css-what root package.json has "type":"module" which
    // prevents webpack from statically tracing require('./types.js').
    config.module
      .rule('css-what-cjs')
      .test(/css-what.*dist[/\\]commonjs.*\.js$/)
      .type('javascript/auto');

    // Disable fullySpecified for ESM modules
    config.module
      .rule('js/ts')
      .resolve.set('fullySpecified', false);

    // Add aliases for ESM modules that need CommonJS resolution
    // Use pnpm's node_modules structure
    const pnpmRoot = path.resolve(__dirname, '..', 'node_modules', '.pnpm');
    const acornPath = path.join(pnpmRoot, 'acorn@8.16.0', 'node_modules', 'acorn', 'dist', 'acorn.js');
    const cssWhatPath = path.join(pnpmRoot, 'css-what@7.0.0', 'node_modules', 'css-what', 'dist', 'commonjs', 'index.js');

    config.resolve.alias
      .set('acorn', acornPath)
      .set('css-what', cssWhatPath);

    // source-map-js uses relative requires (./base64-vlq) that NativeScript's
    // native runtime cannot resolve. Stub out the generator via
    // NormalModuleReplacementPlugin since source map *generation* is not
    // needed at runtime in a NativeScript app.
    const stubPath = path.resolve(__dirname, 'app/stubs/source-map-generator-stub.js');
    config.plugin('source-map-js-stub')
      .use(require('webpack').NormalModuleReplacementPlugin, [
        /source-map-js[/\\]lib[/\\]source-map-generator/,
        stubPath,
      ]);

    // Replace ember-native-devtools' setup-inspector.js with a NativeScript-
    // compatible stub. The original uses socket.io-client@2.x (which requires
    // the Node.js 'url' built-in at load time) and calls fileURLToPath() at
    // module-level, both of which crash the NativeScript JS runtime.
    const devtoolsClientStubPath = path.resolve(__dirname, 'app/stubs/ember-native-devtools-client-stub.js');
    config.plugin('ember-native-devtools-client-stub')
      .use(require('webpack').NormalModuleReplacementPlugin, [
        /ember-native-devtools[/\\]src[/\\]setup-inspector\.js/,
        devtoolsClientStubPath,
      ]);
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

  // Skip Embroider prebuild in CI or if it fails
  return (() => {
    if (process.env.CI) {
      console.log('⚠ Skipping Embroider prebuild in CI environment');
      return conf;
    }
    try {
      require('@embroider/vite');
      console.log('🔨 Running Embroider prebuild...');
      execSync('pnpm ember build', {
        env: {
          ...process.env,
          EMBROIDER_PREBUILD: 'true',
        },
        timeout: 30000, // 30 second timeout
      })
      console.log('✓ Embroider prebuild completed');
    } catch (e) {
      console.warn('⚠ Embroider prebuild failed or timed out:', e?.message || e);
    }
    return conf;
  })();
};
