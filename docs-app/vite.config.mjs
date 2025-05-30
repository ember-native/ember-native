import { classicEmberSupport, ember, extensions } from "@embroider/vite";

import { babel } from "@rollup/plugin-babel";
import { hmr } from "ember-vite-hmr";
import { kolay } from "kolay/vite";
// rollup-plugin-astroturf mjs has wrong import specifiers...
import { createRequire } from "module";
import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
const require = createRequire(import.meta.url);
const astroturf = require("rollup-plugin-astroturf");

export default defineConfig((/* { mode } */) => {
  return {
    base: process.env.DOCS_URL ? "/ember-native/" + process.env.DOCS_URL + "/" : "",
    build: {
      target: ["esnext"],
    },
    css: {
      postcss: "./config/postcss.config.mjs",
    },
    resolve: {
      extensions,
      dedupe: ["ember-primitives"],
    },
    plugins: [
      classicEmberSupport(),
      ember(),
      hmr(),
      kolay({
        src: "public/docs",
        packages: ["ember-native"],
      }),
      babel({
        babelHelpers: "runtime",
        extensions,
      }),
      astroturf({
        include: /\.(gts|gjs)/i,
      }),
    ],
    optimizeDeps: {
      // a wasm-providing dependency
      exclude: ["content-tag"],
      // for top-level-await, etc
      esbuildOptions: {
        target: "esnext",
      },
    },
  };
});
