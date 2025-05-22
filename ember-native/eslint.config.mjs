'use strict';

import { emberNativeGlobals } from './utils/eslint/ember-native.js';
// eslint.config.js
import { configs } from "@nullvoxpopuli/eslint-configs";

const config = configs.ember(import.meta.dirname);

export default [
  ...config,
  // your modifications here
  // see: https://eslint.org/docs/user-guide/configuring/configuration-files#how-do-overrides-work
  {
    languageOptions: {
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
        }
      },
      globals: {
        ...emberNativeGlobals.emberNativeGlobals,
      }
    },
  },
  {
    files: ["**/*.ts", "**/*.gts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["*.{js,cjs}"],
    rules: {
      "n/no-unsupported-features": "off",
    },
  },
];
