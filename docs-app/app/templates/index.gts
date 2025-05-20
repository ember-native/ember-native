import { stylesheet } from 'astroturf';
import { GitHubLink } from 'docs-app/components/header';
import { Logo } from 'docs-app/components/icons';
import Route from 'ember-route-template';
import config from 'docs-app/config/environment';
import { VersionSelector } from 'docs-app/components/version-selector';
import { Article, H2, IndexPage, InternalLink, TopRight } from '@universal-ember/docs-support';

console.log('config', config);

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
    <IndexPage>
      <:logo>
        <div style="margin: 0 auto; transform: translateY(-20%);" class="grid gap-4">
          <h1 style="filter: drop-shadow(3px 5px 0px rgba(0, 0, 0, 0.4));">
            <Logo style="margin: auto; width: fit-content;" />
          </h1>
        </div>
      </:logo>
      <:header>
        <TopRight>
          <GitHubLink />
          <VersionSelector />
        </TopRight>
      </:header>
      <:tagline>
        <p class="text-center">
          use the Ember framework with Nativescript
          <br />
        </p>
      </:tagline>
      <:callToAction>
        <InternalLink
          class={{styles.getStartedLink}}
          href="{{config.rootURL}}1-get-started/index.md"
        >
          Get Started
        </InternalLink>
      </:callToAction>
      <:content>
        <Content />

        <br /><br />
        <br /><br />

        <div class="flex justify-center items-center">
          <GetStarted />
        </div>

        <br /><br />
        <br /><br />

      </:content>
      <:footer></:footer>
    </IndexPage>
  </template>
);

const GetStarted = <template>
  <InternalLink href="{{config.rootURL}}1-get-started/index.md" style="transform: scale(2.5);">
    Get Started ➤
  </InternalLink>
</template>;

const Content = <template>
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
