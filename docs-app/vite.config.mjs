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

const glimmerDirs = fs.readdirSync(
  path.resolve(process.cwd(), "./node_modules/ember-source/dist/packages/@glimmer"),
);


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
    },
    plugins: [
      classicEmberSupport(),
      ember(),
      hmr(),
      astroturf({
        include: /\.(gts|gjs)/i,
      }),
      kolay({
        src: "public/docs",
        packages: ["ember-native"],
      }),
      babel({
        babelHelpers: "runtime",
        extensions,
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
