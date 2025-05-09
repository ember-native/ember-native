import { stylesheet } from 'astroturf';
import { TopRight } from 'docs-app/components/header';
import { Logo } from 'docs-app/components/icons';
import config from 'docs-app/config/environment';
import { Hero } from 'ember-primitives/layout/hero';
import Route from 'ember-route-template';

import { Article, InternalLink } from './page';

import type { TOC } from '@ember/component/template-only';

const styles = stylesheet`
  .getStartedLink {
    box-shadow: inherit;
    padding-left: 3px;
    padding-right: 3px;
    color: white;
    transform: scale(2.5);
    --tw-prose-underline-size: 1px;
    border: 1px solid;
    border-radius: 4px;


    &:hover {
      background-color: rgba(255,255,255,0.55)
    };

    &:active {
      background-color: rgba(255,255,255,0.88)
    }
  }
` as { getStartedLink: string };

export default Route(
  <template>
    <Hero class="shadow-xl shadow-slate-900/5 gradient-background">
      <header class="absolute md:sticky right-0 bottom-0 md:top-0 z-50 p-4 flex items-center">
        <TopRight />
      </header>

      <div class="h-full flex flex-col gap-8 justify-center items-center">
        <div style="margin: 0 auto; transform: translateY(-20%);" class="grid gap-4">
          <h1 style="filter: drop-shadow(3px 5px 0px rgba(0, 0, 0, 0.4));">
            <Logo style="margin: auto; width: fit-content;" />
          </h1>
          <p class="italic text-white w-full mx-auto">
            use the Ember framework with Nativescript
            <br />
          </p>
        </div>
        <InternalLink
          class={{styles.getStartedLink}}
          href="{{config.rootURL}}1-get-started/index.md"
        >
          Get Started
        </InternalLink>

      </div>
    </Hero>

    <style>
      .gradient-background {
        background-image: linear-gradient(-45deg in oklch, #1252e3, #485de5, #7812e5, #3512c5);
        background-size: 400% 400%;
        animation: gradient-animation 16s ease infinite;
      }
      body.dark .gradient-background {
        background-image: linear-gradient(-45deg in oklch, #110043, #182d75, #280065, #350076);
      }
      @keyframes gradient-animation {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
    </style>

    <Content />

    <br /><br />
    <br /><br />

    <div class="flex justify-center items-center">
      <GetStarted />
    </div>

    <br /><br />

    <br /><br />
    <br /><br />

    <hr />
  </template>
);

const GetStarted = <template>
  <InternalLink href="{{config.rootURL}}1-get-started/index.md" style="transform: scale(2.5);">
    Get Started ➤
  </InternalLink>
</template>;

export const Content = <template>
  <br /><br />

  <div class="mx-auto" style="width: 66%">
    <Article class="flex flex-wrap gap-12 justify-between">
      <div>
        <H2>Goals</H2>

        <ul>
          <li>use the Ember framework with Nativescript</li>
          <li>high-quality components and utilities</li>
          <li>pure data derivation</li>
          <li>no extra rendering</li>
          <li>no unneeded DOM</li>
          <li>be contextually aware</li>
          <li>be flexible</li>
          <li>use the latest technology</li>
        </ul>
      </div>

      <div>
        <H2>Features</H2>

        <ul>
          <li>ember routing</li>
          <li>List View</li>
          <li>Rad List View</li>
        </ul>
      </div>
    </Article>
  </div>
</template>;

const H2: TOC<{ Blocks: { default: [] } }> = <template>
  <h2 class="text-3xl">{{yield}}</h2>
</template>;
