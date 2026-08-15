import path from 'path';
import fs from 'fs';
import postcss from 'rollup-plugin-postcss';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';
import { Addon } from '@embroider/addon-dev/rollup';
import reexportsGuard from './rollup-app-reexports-guard.js';

// rollup-plugin-astroturf mjs has wrong import specifiers...
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const astroturf = require('rollup-plugin-astroturf');

const { analyzeAppReexports } = reexportsGuard;

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

const assertAppReexportsMatchTargets = () => {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  return {
    name: 'assert-app-reexports-match-targets',
    generateBundle(_options, bundle) {
      const { mismatches, unrecognized } = analyzeAppReexports(bundle, pkg.name);
      if (mismatches.length === 0 && unrecognized.length === 0) return;

      const lines = [
        ...mismatches.map(
          (m) =>
            `  "${m.fileName}" reexports [${m.missing.join(', ')}] from "${m.targetFileName}", but that module only exports: ${m.targetExports.join(', ') || '(nothing)'}`,
        ),
        ...unrecognized.map((u) => `  "${u.fileName}": ${u.reason}`),
      ];
      throw new Error(
        `addon.appReexports() emitted _app_ stub(s) this check couldn't verify:\n${lines.join('\n')}`,
      );
    },
  };
};

const rootImport = (options) => ({
  resolveId: (importee) => {
    if (importee[0] === '/') {
      const rootPath = `${options.root}${importee}`;
      const absPath = path.resolve('.', rootPath);
      return fs.existsSync(absPath) ? absPath : null;
    }
    return null;
  },
});

export default {
  // This provides defaults that work well alongside `publicEntrypoints` below.
  // You can augment this if you need to.
  output: addon.output(),

  treeshake: true,

  plugins: [
    // These are the modules that users should be able to import from your
    // addon. Anything not listed here may get optimized away.
    // By default all your JavaScript modules (**/*.js) will be importable.
    // But you are encouraged to tweak this to only cover the modules that make
    // up your addon's public API. Also make sure your package.json#exports
    // is aligned to the config here.
    // See https://github.com/embroider-build/embroider/blob/main/docs/v2-faq.md#how-can-i-define-the-public-exports-of-my-addon
    addon.publicEntrypoints(
      ['**/*.{js,ts}', 'index.js', 'template-registry.js'],
      { exclude: ['**/*.test.ts'] },
    ),

    // These are the modules that should get reexported into the traditional
    // "app" tree. Things in here should also be in publicEntrypoints above, but
    // not everything in publicEntrypoints necessarily needs to go here.
    //
    // `*/index.{js,ts,gts,gjs}` is excluded: today the only files matching
    // that pattern are the top-level barrel files (`components/index.gts`,
    // `modifiers/index.ts`) that only re-export named bindings, not a
    // default export. addon-dev unconditionally assumes every reexported
    // file has a default export, so without this exclude it emits
    // `export { default } from "..."` stubs for these too, referencing a
    // default export that doesn't exist. The glob is scoped to a single
    // path segment (top-level barrels only) so a colocated default-exporting
    // component like `components/foo/index.gts` still gets reexported
    // normally - it's matched against the pre-mapFilename bundle key
    // (e.g. `components/index.js`), which is one segment deep for barrels.
    addon.appReexports(
      [
        'components/**/*.{js,ts,gts,gjs}',
        'helpers/**/*.{js,ts}',
        'modifiers/**/*.{js,ts}',
        'services/**/*.{js,ts}',
        'initializers/**/*.{js,ts}',
        'instance-initializers/**/*.{js,ts}',
      ],
      {
        exclude: ['*/index.{js,ts,gts,gjs}'],
        mapFilename: (fn) => {
          const parts = fn.split('/');
          parts.splice(1, 0, 'ember-native');
          return parts.join('/');
        },
      },
    ),

    // Regression guard: fail the build if any `_app_` reexport stub claims
    // an export that its target module doesn't actually have (e.g. the
    // `export { default }` mismatch above). See
    // rollup-app-reexports-guard.test.js for the fast, direct version of
    // this same check.
    assertAppReexportsMatchTargets(),

    // Follow the V2 Addon rules about dependencies. Your code can import from
    // `dependencies` and `peerDependencies` as well as standard Ember-provided
    // package names.
    addon.dependencies(),

    // This babel config should *not* apply presets or compile away ES modules.
    // It exists only to provide development niceties for you, like automatic
    // template colocation.
    //
    // By default, this will load the actual babel config from the file
    // babel.config.json.
    babel({
      extensions: ['.js', '.gjs', '.ts', '.gts'],
      babelHelpers: 'bundled',
    }),

    astroturf({
      include: /\.(jsx?|tsx?|gts|gjs)/i,
    }),

    // Ensure that standalone .hbs files are properly integrated as Javascript.
    addon.hbs(),

    // Ensure that .gjs files are properly integrated as Javascript
    addon.gjs(),

    // addons are allowed to contain imports of .css files, which we want rollup
    // to leave alone and keep in the published output.
    addon.keepAssets(['styles/**/*.scss']),

    // Remove leftover build artifacts when starting a new build.
    //addon.clean({}),

    rootImport({
      // Will first look in `client/src/*` and then `common/src/*`.
      root: './src',
    }),

    postcss({
      modules: true,
    }),

    // Copy Readme and License into published package
    copy({
      targets: [
        { src: '../README.md', dest: '.' },
        { src: '../LICENSE.md', dest: '.' },
        { src: './utils/**/*', dest: './dist/utils' },
      ],
      // *.test.js files live alongside the utils they test (see
      // javaproxy-sbg-hint.test.js) and run via `pnpm test` straight out of
      // `utils/`, before this copy step - they don't need to ship in the
      // published package.
      ignore: ['**/*.test.js'],
    }),
  ],
};
