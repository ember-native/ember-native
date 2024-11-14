import path from 'path';
import theme from 'tailwindcss/defaultTheme';
import generated from '@tailwindcss/typography';

const appRoot = path.join(__dirname, '../');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`${appRoot}/app/**/*.{js,ts,hbs,gjs,gts,html}`],
  darkMode: 'selector',
  theme: {
    extend: {
      maxWidth: {
        '8xl': '88rem',
      },
      fontFamily: {
        sans: ['InterVariable', ...theme.fontFamily.sans],
        display: ['Lexend', { fontFeatureSettings: '"ss01"' }],
      },
    },
  },
  plugins: [generated],
};
