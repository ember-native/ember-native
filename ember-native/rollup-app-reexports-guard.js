'use strict';

// addon-dev's `appReexports()` (see rollup.config.mjs) always assumes the
// module it's reexporting has a default export unless told otherwise, so a
// stub like `export { default } from "ember-native/components/index"` gets
// emitted even when the target only has named exports. That's silently
// broken for any consumer that eagerly resolves these `_app_` stubs (e.g.
// Vite's `import.meta.glob`-based classic module auto-registration) - it
// fails to build because the named export it's re-exporting doesn't exist.
//
// This inspects Rollup's own `generateBundle` bundle map - which already
// has each chunk's real `exports` list computed - to catch that class of
// mistake (e.g. a future barrel/aggregator file added to one of
// `appReexports()`'s include globs without excluding it) before it ships.
//
// Deliberately fails closed: in a real build every `_app_` stub is emitted
// from `Object.keys(bundle)` by addon-dev's own plugin (see
// rollup-app-reexports.js in @embroider/addon-dev), so its target is always
// a key in that same `bundle` and its specifier always starts with this
// package's own name - there's no legitimate case where a stub's shape or
// target can't be resolved. If one shows up as `unrecognized` instead, that
// means addon-dev's emitted stub format changed underneath this check (its
// exact text - one space, double quotes, trailing semicolon - is
// load-bearing for the regex below) and the check can no longer vouch for
// anything, which must fail the build rather than silently pass.
function analyzeAppReexports(bundle, packageName) {
  const mismatches = [];
  const unrecognized = [];
  const prefix = `${packageName}/`;

  for (const [fileName, file] of Object.entries(bundle)) {
    if (!fileName.startsWith('_app_/') || file.type !== 'asset') continue;

    const source = typeof file.source === 'string' ? file.source : file.source.toString('utf8');
    const match = /^export \{([^}]*)\} from "([^"]+)";/.exec(source);
    if (!match) {
      unrecognized.push({
        fileName,
        reason: `stub source doesn't match the expected 'export { ... } from "...";' shape: ${source.slice(0, 200)}`,
      });
      continue;
    }

    const [, namesRaw, specifier] = match;
    const names = namesRaw
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);

    if (!specifier.startsWith(prefix)) {
      unrecognized.push({
        fileName,
        reason: `specifier "${specifier}" doesn't start with this package's own name ("${prefix}")`,
      });
      continue;
    }

    const targetFileName = `${specifier.slice(prefix.length)}.js`;
    const target = bundle[targetFileName];
    if (!target || target.type !== 'chunk') {
      unrecognized.push({
        fileName,
        reason: `target "${targetFileName}" (resolved from specifier "${specifier}") isn't a chunk in this bundle`,
      });
      continue;
    }

    const missing = names.filter((name) => !target.exports.includes(name));
    if (missing.length > 0) {
      mismatches.push({ fileName, targetFileName, missing, targetExports: target.exports });
    }
  }

  return { mismatches, unrecognized };
}

module.exports = { analyzeAppReexports };
