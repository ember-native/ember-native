import autoprefixer from "autoprefixer";
import postcssImport from "postcss-import";
import tailwindcss from "@tailwindcss/postcss";

const config = {
  plugins: [
    postcssImport(),
    tailwindcss(),
    autoprefixer(),
  ],
};

export default config;