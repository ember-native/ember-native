import type { TOC } from '@ember/component/template-only';
import emberNativeLogo from './icons/ember-native.svg?raw';
import { htmlSafe } from '@ember/template';
/**
 * Copied from font-awesome directly,
 * but with the addition of fill="currentColor"
 *
 * Font Awesome Free 6.6.0 by @fontawesome
 * - https://fontawesome.com License
 * - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.
 */

export const XTwitter: TOC<{ Element: SVGElement }> = <template>
  <svg aria-hidden="true" ...attributes>
    <use xlink:href="#social-xtwitter" />
  </svg>
</template>;

export const Discord: TOC<{ Element: SVGElement }> = <template>
  <svg aria-hidden="true" ...attributes>
    <use xlink:href="#social-discord" />
  </svg>
</template>;

export const Threads: TOC<{ Element: SVGElement }> = <template>
  <svg aria-hidden="true" ...attributes>
    <use xlink:href="#social-threads" />
  </svg>
</template>;

export const BlueSky: TOC<{ Element: SVGElement }> = <template>
  <svg aria-hidden="true" ...attributes>
    <use xlink:href="#social-bluesky" />
  </svg>
</template>;

export const Mastodon: TOC<{ Element: SVGElement }> = <template>
  <svg aria-hidden="true" ...attributes>
    <use xlink:href="#social-mastodon" />
  </svg>
</template>;

export const Sun: TOC<{ Element: SVGElement }> = <template>
  <svg aria-hidden="true" viewBox="0 0 16 16" ...attributes>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 1a1 1 0 0 1 2 0v1a1 1 0 1 1-2 0V1Zm4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm2.657-5.657a1 1 0 0 0-1.414 0l-.707.707a1 1 0 0 0 1.414 1.414l.707-.707a1 1 0 0 0 0-1.414Zm-1.415 11.313-.707-.707a1 1 0 0 1 1.415-1.415l.707.708a1 1 0 0 1-1.415 1.414ZM16 7.999a1 1 0 0 0-1-1h-1a1 1 0 1 0 0 2h1a1 1 0 0 0 1-1ZM7 14a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0v-1Zm-2.536-2.464a1 1 0 0 0-1.414 0l-.707.707a1 1 0 0 0 1.414 1.414l.707-.707a1 1 0 0 0 0-1.414Zm0-8.486A1 1 0 0 1 3.05 4.464l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707ZM3 8a1 1 0 0 0-1-1H1a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1Z"
    />
  </svg>
</template>;

export const Moon: TOC<{ Element: SVGElement }> = <template>
  <svg aria-hidden="true" viewBox="0 0 16 16" ...attributes>
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7.23 3.333C7.757 2.905 7.68 2 7 2a6 6 0 1 0 0 12c.68 0 .758-.905.23-1.332A5.989 5.989 0 0 1 5 8c0-1.885.87-3.568 2.23-4.668ZM12 5a1 1 0 0 1 1 1 1 1 0 0 0 1 1 1 1 0 1 1 0 2 1 1 0 0 0-1 1 1 1 0 1 1-2 0 1 1 0 0 0-1-1 1 1 0 1 1 0-2 1 1 0 0 0 1-1 1 1 0 0 1 1-1Z"
    />
  </svg>
</template>;

export const GitHub: TOC<{ Element: SVGElement }> = <template>
  <svg aria-hidden="true" ...attributes>
    <use xlink:href="#social-github" />
  </svg>
</template>;

export const Flask: TOC<{ Element: SVGElement }> = <template>
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    height="1em"
    viewBox="0 0 448 512"
    ...attributes
  >{{!! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. }}<path
      d="M288 0H160 128C110.3 0 96 14.3 96 32s14.3 32 32 32V196.8c0 11.8-3.3 23.5-9.5 33.5L10.3 406.2C3.6 417.2 0 429.7 0 442.6C0 480.9 31.1 512 69.4 512H378.6c38.3 0 69.4-31.1 69.4-69.4c0-12.8-3.6-25.4-10.3-36.4L329.5 230.4c-6.2-10.1-9.5-21.7-9.5-33.5V64c17.7 0 32-14.3 32-32s-14.3-32-32-32H288zM192 196.8V64h64V196.8c0 23.7 6.6 46.9 19 67.1L309.5 320h-171L173 263.9c12.4-20.2 19-43.4 19-67.1z"
    /></svg>
</template>;

export const Menu: TOC<{ Element: SVGElement }> = <template>
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="2"
    stroke-linecap="round"
    ...attributes
  >
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
</template>;

export const Logo: TOC<{ Element: SVGElement }> = <template>
  <svg viewBox="0 22.365 102.833 106.635" width="129" height="129" ...attributes>
    <g fill="none" fill-rule="evenodd" style="" transform="matrix(0.79618, 0, 0, 0.82753, -0.150385, 21.877144)">
      <path d="M12.85.928h103.384c6.797 0 12.307 5.51 12.307 12.308V116.62c0 6.798-5.51 12.308-12.307 12.308H12.849c-6.797 0-12.308-5.51-12.308-12.308V13.236C.541 6.438 6.051.928 12.85.928z" fill="#E05C43" fill-rule="nonzero"></path>
      <path d="M52.506 65.515c.522-20.675 14.073-29.71 18.766-25.187 4.692 4.512 2.951 14.24-5.909 20.322-8.858 6.083-12.857 4.865-12.857 4.865m12.857 21.022c-12.039.304-10.771-7.605-10.771-7.605S98.545 63.89 86.56 34.178c-5.386-7.645-11.645-10.047-20.502-9.872-8.86.173-19.77 5.576-26.894 21.563-3.398 7.63-4.552 14.857-5.245 20.334 0 0-7.785 1.563-11.955-1.904-4.168-3.472-6.36 0-6.36 0s-7.178 8.4-.052 11.183c7.124 2.782 18.219 3.344 18.219 3.344h-.005c1.02 7.398 3.534 14.51 12.668 20.45 15.316 9.965 38.044-.56 38.044-.56 13.622-5.693 22.67-14.507 26.527-18.8a3.535 3.535 0 0 0-.092-4.823l-4.436-4.61a3.537 3.537 0 0 0-4.799-.283c-5.925 4.853-21.5 16.337-36.316 16.337" fill="#FEFEFE"></path>
    </g>
    <path d="M 97.377 26.731 C 98.769 28.22 99.492 30.084 99.545 32.324 L 99.545 48.143 C 99.492 50.383 98.769 52.247 97.377 53.736 C 95.984 55.223 94.239 55.995 92.144 56.052 L 77.34 56.052 C 75.244 55.996 73.499 55.223 72.107 53.736 C 70.714 52.247 69.99 50.383 69.938 48.143 L 69.938 32.324 C 69.99 30.084 70.714 28.22 72.107 26.731 C 73.499 25.244 75.244 24.471 77.34 24.414 L 92.144 24.414 C 94.239 24.471 95.984 25.244 97.377 26.731 Z M 95.335 39.461 C 94.869 38.966 94.627 38.347 94.608 37.598 L 94.608 32.324 C 94.594 31.578 94.354 30.956 93.888 30.458 C 93.424 29.962 92.841 29.706 92.144 29.69 L 89.679 29.69 L 89.679 42.868 L 79.804 29.69 L 77.34 29.69 C 76.641 29.706 76.059 29.962 75.595 30.458 C 75.129 30.956 74.889 31.578 74.875 32.324 L 74.875 37.598 C 74.855 38.347 74.615 38.966 74.147 39.461 C 73.683 39.954 73.102 40.213 72.404 40.232 C 73.102 40.254 73.683 40.511 74.147 41.005 C 74.615 41.501 74.855 42.12 74.875 42.868 L 74.875 48.143 C 74.889 48.89 75.129 49.511 75.595 50.007 C 76.059 50.506 76.642 50.761 77.34 50.777 L 79.804 50.777 L 79.804 37.598 L 89.679 50.777 L 92.144 50.777 C 92.841 50.761 93.424 50.506 93.888 50.008 C 94.354 49.511 94.594 48.89 94.608 48.143 L 94.608 42.868 C 94.627 42.12 94.869 41.501 95.335 41.005 C 95.8 40.512 96.381 40.254 97.079 40.232 C 96.381 40.213 95.799 39.954 95.336 39.461 L 95.335 39.461 Z" style="fill: rgb(255, 255, 255);"></path>
  </svg>
</template>;

export const Logomark: TOC<{ Element: SVGElement }> = <template>
  <svg viewBox="0 0 806.5 200" ...attributes>
    <g fill="none" fill-rule="evenodd">
      <g stroke-width=".4">
        <path
          fill="#e05c43"
          fill-rule="nonzero"
          d="M100 0a100 100 0 1 1 0 200 100 100 0 0 1 0-200z"
        />
        <path
          fill="#fff"
          d="M102 37.7c12.9-.3 22 3.2 29.8 14.4 17 42.3-44 64.2-46.4 65h-.1s-1.8 11.6 15.7 11.1c21.5 0 44.2-16.7 52.8-23.7a5.1 5.1 0 0 1 7 .4l6.4 6.7a5.1 5.1 0 0 1 .2 7c-5.7 6.2-18.8 19-38.6 27.3 0 0-33 15.4-55.4.9-13.3-8.7-17-19-18.4-29.8 0 0-16.1-.8-26.5-4.9-10.4-4 0-16.2 0-16.2s3.3-5 9.3 0c6.1 5 17.4 2.7 17.4 2.7 1-8 2.7-18.4 7.7-29.5C73.2 45.8 89 38 101.9 37.7zm7.6 23.3c-6.9-6.6-26.6 6.6-27.3 36.6 0 0 5.8 1.8 18.7-7 12.9-8.9 15.4-23 8.6-29.6z"
        />
      </g>
      <path
        class="fill-slate-900 dark:fill-slate-50"
        d="M306.8 101.8q-1.3 10.6-5.6 19.2t-11 13q-6.7 4.4-15 4.2-11-.3-17.2-7.9l-6.4 33.6h-15.5l17-97.6h14.1l-1.2 7.3q8.1-8.8 19.2-8.6 6.7.1 11.7 3.5 5 3.3 7.5 9.7 2.7 6.4 2.9 14.2 0 4-.5 9.4zm-15.2-1.3.3-4.8q.2-8.4-2.8-13-2.9-4.6-8.8-4.8-8.7-.2-15.1 8l-5.5 31.5q3 7.9 12 8.1 7.6.2 12.8-6 5.3-6.1 7.1-19zm68-19.7q-3-.6-6-.6-10.2-.3-16.2 8.4l-8.4 48.2h-15.5l12.2-70.4 14.7-.1-1.6 8q7.2-9.6 16.7-9.4 2.1 0 5.9 1zm15.6 56h-15.4L372 66.3h15.5zm-1-88.5q0-3.6 2.4-6.1t6.3-2.7q3.8-.1 6.3 2.4 2.5 2.4 2.5 5.9 0 3.7-2.5 6.1-2.4 2.4-6.2 2.6-3.7 0-6.2-2.3-2.5-2.4-2.5-5.9zm44 18-1.3 7.5q8.7-9 20.8-8.7 6.7 0 11 3 4.4 3 6 7.8 9.8-11.1 22.4-10.8 10.3.2 15.2 7 5 6.8 3.8 19l-7.6 45.7H473l7.6-45.8q.4-2.8.1-5.2-1-7.7-9.6-7.9-9.6-.2-15.1 10.5l-.2 1.5-8.1 46.9h-15.5l7.7-45.6q.3-2.8 0-5.2-1-7.9-9.6-8-8.6-.2-14.4 7.7l-9 51.1h-15.4l12.2-70.4zm102.3 70.5h-15.4l12.2-70.5h15.4zm-1-88.5q0-3.6 2.4-6.1t6.3-2.7q3.8-.1 6.2 2.4 2.6 2.4 2.6 5.9 0 3.7-2.5 6.1-2.4 2.4-6.2 2.6-3.7 0-6.2-2.3-2.6-2.4-2.6-5.9zm52 .9-3 17.2h12l-2 11.7h-12.1l-6.7 39.4q-.2 1.7 0 3 .4 4.2 5.2 4.4 2.4 0 5.5-.6l-1 12.4q-5 1.3-9.8 1.3-8-.1-12.1-5.4-4-5.4-3.1-14.3l6.6-40.2h-11.3l2-11.7H553l3-17.2zm24.7 87.6h-15.4L593 66.3h15.5zm-1-88.5q0-3.6 2.4-6.1 2.3-2.5 6.3-2.7 3.8-.1 6.3 2.4 2.5 2.4 2.5 5.9 0 3.7-2.5 6.1-2.4 2.4-6.1 2.6-3.8 0-6.3-2.3-2.5-2.4-2.5-5.9zm45.2 68.3 22.2-50.2h16.5l-34.7 70.4H631l-13-70.4h15.5zm67.1 21.5q-9.2-.2-16-4.6-6.6-4.4-9.9-12.1-3.2-7.7-2.4-17.2l.2-2.6q1.2-10.8 6.3-19.3 5.1-8.6 12.7-13T715 65q13.3.2 19.8 9.8 6.7 9.6 5 25l-.9 6.7h-44.3Q694 115 698 120q4 5.2 11 5.3 9.9.3 18.3-8.7l7.8 8.2q-4.4 6.4-11.7 9.9-7.2 3.4-15.8 3.3zm6.6-60.4q-12.2-.4-18.4 17.3H725l.2-1.3q.5-3 .1-5.9-.7-4.6-3.6-7.3-3-2.6-7.6-2.8zm72.9 39.6q1.1-6.5-8.4-9-9.4-2.5-12.9-4-13.4-5.7-13-17.4.4-9.5 8.7-15.7 8.3-6.3 19.9-6.2 11.2.2 18.2 6.4 7.1 6.1 7 16.2h-15.3q.1-5-2.7-7.7-2.8-2.8-7.7-3-5.1 0-8.8 2.6-3.7 2.5-4.3 6.6-.9 6 8.4 8.3 9.2 2.3 13.6 4.2 13 5.7 12.5 17.7-.3 6.8-4.4 11.8-4 5-11 7.6-6.8 2.6-14.4 2.4-11.6-.1-19.2-6.7-7.5-6.6-7.4-16.9h15q0 5.8 3.3 8.7 3.2 3 9 3 5.6 0 9.4-2.4 3.9-2.4 4.5-6.5z"
      />
    </g>
  </svg>
</template>;

export const LightBulb: TOC<{ Element: SVGElement }> = <template>
  <svg
    aria-hidden="true"
    viewBox="0 0 32 32"
    fill="none"
    class="[--icon-foreground:theme(colors.slate.900)] [--icon-background:theme(colors.white)]"
    ...attributes
  >
    <defs>
      <radialGradient
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        id=":S6:-gradient"
        gradientTransform="matrix(0 21 -21 0 20 11)"
      >
        <stop stop-color="#0EA5E9"></stop><stop stop-color="#22D3EE" offset=".527"></stop>
        <stop stop-color="#818CF8" offset="1"></stop>
      </radialGradient>
      <radialGradient
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        id=":S6:-gradient-dark"
        gradientTransform="matrix(0 24.5001 -19.2498 0 16 5.5)"
      >
        <stop stop-color="#0EA5E9"></stop><stop stop-color="#22D3EE" offset=".527"></stop>
        <stop stop-color="#818CF8" offset="1"></stop>
      </radialGradient></defs>
    <g class="dark:hidden">
      <circle cx="20" cy="20" r="12" fill="url(#:S6:-gradient)"></circle>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M20 24.995c0-1.855 1.094-3.501 2.427-4.792C24.61 18.087 26 15.07 26 12.231 26 7.133 21.523 3 16 3S6 7.133 6 12.23c0 2.84 1.389 5.857 3.573 7.973C10.906 21.494 12 23.14 12 24.995V27a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.005Z"
        class="fill-[var(--icon-background)]"
        fill-opacity="0.5"
      ></path>
      <path
        d="M25 12.23c0 2.536-1.254 5.303-3.269 7.255l1.391 1.436c2.354-2.28 3.878-5.547 3.878-8.69h-2ZM16 4c5.047 0 9 3.759 9 8.23h2C27 6.508 21.998 2 16 2v2Zm-9 8.23C7 7.76 10.953 4 16 4V2C10.002 2 5 6.507 5 12.23h2Zm3.269 7.255C8.254 17.533 7 14.766 7 12.23H5c0 3.143 1.523 6.41 3.877 8.69l1.392-1.436ZM13 27v-2.005h-2V27h2Zm1 1a1 1 0 0 1-1-1h-2a3 3 0 0 0 3 3v-2Zm4 0h-4v2h4v-2Zm1-1a1 1 0 0 1-1 1v2a3 3 0 0 0 3-3h-2Zm0-2.005V27h2v-2.005h-2ZM8.877 20.921C10.132 22.136 11 23.538 11 24.995h2c0-2.253-1.32-4.143-2.731-5.51L8.877 20.92Zm12.854-1.436C20.32 20.852 19 22.742 19 24.995h2c0-1.457.869-2.859 2.122-4.074l-1.391-1.436Z"
        class="fill-[var(--icon-foreground)]"
      ></path>
      <path
        d="M20 26a1 1 0 1 0 0-2v2Zm-8-2a1 1 0 1 0 0 2v-2Zm2 0h-2v2h2v-2Zm1 1V13.5h-2V25h2Zm-5-11.5v1h2v-1h-2Zm3.5 4.5h5v-2h-5v2Zm8.5-3.5v-1h-2v1h2ZM20 24h-2v2h2v-2Zm-2 0h-4v2h4v-2Zm-1-10.5V25h2V13.5h-2Zm2.5-2.5a2.5 2.5 0 0 0-2.5 2.5h2a.5.5 0 0 1 .5-.5v-2Zm2.5 2.5a2.5 2.5 0 0 0-2.5-2.5v2a.5.5 0 0 1 .5.5h2ZM18.5 18a3.5 3.5 0 0 0 3.5-3.5h-2a1.5 1.5 0 0 1-1.5 1.5v2ZM10 14.5a3.5 3.5 0 0 0 3.5 3.5v-2a1.5 1.5 0 0 1-1.5-1.5h-2Zm2.5-3.5a2.5 2.5 0 0 0-2.5 2.5h2a.5.5 0 0 1 .5-.5v-2Zm2.5 2.5a2.5 2.5 0 0 0-2.5-2.5v2a.5.5 0 0 1 .5.5h2Z"
        class="fill-[var(--icon-foreground)]"
      ></path>
    </g>
    <g class="hidden dark:inline">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M16 2C10.002 2 5 6.507 5 12.23c0 3.144 1.523 6.411 3.877 8.691.75.727 1.363 1.52 1.734 2.353.185.415.574.726 1.028.726H12a1 1 0 0 0 1-1v-4.5a.5.5 0 0 0-.5-.5A3.5 3.5 0 0 1 9 14.5V14a3 3 0 1 1 6 0v9a1 1 0 1 0 2 0v-9a3 3 0 1 1 6 0v.5a3.5 3.5 0 0 1-3.5 3.5.5.5 0 0 0-.5.5V23a1 1 0 0 0 1 1h.36c.455 0 .844-.311 1.03-.726.37-.833.982-1.626 1.732-2.353 2.354-2.28 3.878-5.547 3.878-8.69C27 6.507 21.998 2 16 2Zm5 25a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1 3 3 0 0 0 3 3h4a3 3 0 0 0 3-3Zm-8-13v1.5a.5.5 0 0 1-.5.5 1.5 1.5 0 0 1-1.5-1.5V14a1 1 0 1 1 2 0Zm6.5 2a.5.5 0 0 1-.5-.5V14a1 1 0 1 1 2 0v.5a1.5 1.5 0 0 1-1.5 1.5Z"
        fill="url(#:S6:-gradient-dark)"
      ></path>
    </g>
  </svg>
</template>;
