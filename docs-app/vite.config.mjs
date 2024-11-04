import { defineConfig } from 'vite';
import { hmr } from 'ember-vite-hmr';
import {
  resolver,
  hbs,
  scripts,
  templateTag,
  optimizeDeps,
  compatPrebuild,
  assets,
  contentFor,
} from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { kolay } from 'kolay/vite';
import postcssConfig from './config/postcss.config.js';

// rollup-plugin-astroturf mjs has wrong import specifiers...
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const astroturf = require('rollup-plugin-astroturf');


const extensions = [
  '.mjs',
  '.gjs',
  '.js',
  '.mts',
  '.gts',
  '.ts',
  '.hbs',
  '.json',
];

const aliasPlugin = {
  name: 'env',
  setup(build) {
    // Intercept import paths called "env" so esbuild doesn't attempt
    // to map them to a file system location. Tag them with the "env-ns"
    // namespace to reserve them for this plugin.
    build.onResolve({ filter: /^kolay.*:virtual$/ }, (args) => ({
      path: args.path,
      external: true
    }));

    build.onResolve({ filter: /ember-template-compiler$/ }, () => ({
      path: "ember-source/dist/ember-template-compiler",
      external: true,
    }));
  },
};

const o = optimizeDeps();
o.esbuildOptions.target = 'esnext';
o.esbuildOptions.plugins.splice(0, 0, aliasPlugin);

export default defineConfig(({ mode }) => {
  return {
    base: '/ember-native/' + process.env.DOCS_URL || '',
    resolve: {
      extensions,
    },
    plugins: [
      astroturf({
        include: /\.(gts|gjs)/i,
      }),
      kolay({
        src: 'public/docs',
        baseUrl: '/ember-native/' + (process.env.DOCS_URL || '') + '/',
        packages: ['ember-native'],
      }),
      hbs(),
      templateTag(),
      scripts(),
      resolver(),
      compatPrebuild(),
      assets(),
      contentFor(),
      hmr(),
      babel({
        babelHelpers: 'runtime',
        extensions,
      }),
    ],
    css: {
      postcss: postcssConfig,
    },
    optimizeDeps: o,
    server: {
      port: 4200,
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: 'index.html',
          ...(shouldBuildTests(mode)
            ? { tests: 'tests/index.html' }
            : undefined),
        },
      },
    },
  };
});

function shouldBuildTests(mode) {
  return mode !== 'production' || process.env.FORCE_BUILD_TESTS;
}
