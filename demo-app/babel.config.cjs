const {
  babelCompatSupport,
} = require('@embroider/compat/babel');
const hmrPlugin = require('ember-native/utils/babel-plugin.js');
const macros = require("@embroider/macros/src/macros-config");
const { babelPlugin } = require('@warp-drive/core/build-config');

process.env.NODE_ENV = 'development';

global.__embroider_macros_global__ = {
    value: null,
    set(key, val) {
        this.value = val;
    },
    get() {
        return this.value;
    }
};

// Configure WarpDrive using the official babel plugin
const warpDriveMacros = babelPlugin({
  compatWith: '5.6',
  env: {
    DEBUG: process.env.DEBUG || false,
  },
});

module.exports = {
  plugins: [
      hmrPlugin.default,
    [
      'babel-plugin-ember-template-compilation',
      {
        compilerPath: 'ember-source/dist/ember-template-compiler.js',
        targetFormat: 'wire',
        enableLegacyModules: [],
        transforms: [hmrPlugin.hotAstProcessor.transform],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: require.resolve('decorator-transforms/runtime-esm'),
        },
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        absoluteRuntime: __dirname,
        useESModules: true,
        regenerator: false,
      },
    ],
    [
      require.resolve('ember-compatibility-helpers/comparision-plugin.js'),
      {
        emberVersion: require('ember-source/package.json').version,
        root: process.cwd(),
        name: require('./package.json').name
      },
    ],
    ["@babel/plugin-transform-typescript", { allowDeclareFields: true }],
    ...babelCompatSupport()
      .filter(x => !(x[0] || x).includes('macros-babel-plugin.js'))
      .filter(x => !(x[0] || x).includes('babel-plugin-cache-busting.js')),
    ...warpDriveMacros.js,
  ],

  generatorOpts: {
    compact: false,
  },
};


const config = macros.default.for({}, process.cwd());
config.setConfig(__filename, 'ember-qunit', {
    disableContainerStyles: true,
    theme: 'no-theme'
});
