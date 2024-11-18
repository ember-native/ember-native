const {
  babelCompatSupport,
} = require('@embroider/compat/babel');
const hmrPlugin = require('ember-native/utils/babel-plugin');

process.env.NODE_ENV = 'development';


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
    ...babelCompatSupport(),
  ],

  generatorOpts: {
    compact: false,
  },
};
