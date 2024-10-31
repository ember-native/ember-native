import postcssImport from 'postcss-import';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config';

export default {
  plugins: [
    postcssImport(),
    tailwind(tailwindConfig),
    autoprefixer()
  ]
};
