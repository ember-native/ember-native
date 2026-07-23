import { defineConfig, mergeConfig } from 'vite';
import { typescriptConfig } from '@nativescript/vite';
// eslint-disable-next-line import/no-unresolved
import configureEmberNativeVite from 'ember-native/utils/vite.config.js';

export default defineConfig(({ mode }) => {
  const emberNativeConfig = configureEmberNativeVite();
  // ember-native's plugins (classicEmberSupport/ember/babel) go first so
  // their `enforce: 'pre'` resolver/template-tag plugins get first refusal
  // on resolving Ember specifiers, ahead of @nativescript/vite's own
  // resolver (see ember-native/utils/vite.config.js for why).
  const merged = mergeConfig(emberNativeConfig, typescriptConfig({ mode }));
  // `mergeConfig` appends ember-native's `resolve.alias` entries (normalized
  // to array form) after @nativescript/vite's own, but Vite's alias
  // resolution is first-match-wins - move ours to the front so they can't be
  // shadowed by one of @nativescript/vite's broader platform-resolution
  // aliases (e.g. `packagePlatformAliases`'s catch-all `customResolver`).
  const aliases = merged.resolve!.alias as { find: string | RegExp; replacement: string }[];
  const emberNativeReplacements = new Set(
    (emberNativeConfig.resolve!.alias as { replacement: string }[]).map((a) => a.replacement),
  );
  const [ours, rest] = [
    aliases.filter((a) => emberNativeReplacements.has(a.replacement)),
    aliases.filter((a) => !emberNativeReplacements.has(a.replacement)),
  ];
  merged.resolve!.alias = [...ours, ...rest];
  return mergeConfig(merged, {
    resolve: { preserveSymlinks: false },
  });
});
