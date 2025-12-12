import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { typescriptConfig } from '@nativescript/vite';

export default defineConfig(({ mode }) => {
  const config = typescriptConfig({ mode });
  config.plugins = [
    classicEmberSupport(),
    ember(),
    // extra plugins here
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
    ...config.plugins
  ];
  return config;
});
