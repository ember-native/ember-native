import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { typescriptConfig } from '@nativescript/vite';
import Module from 'module';

const req = Module.prototype.require;
Module.prototype.require = function (...args) {
  console.log('require', ...args);
  return req.call(this, ...args);
}

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
