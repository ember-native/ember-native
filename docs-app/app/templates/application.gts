import BasicDropdownWormhole from 'ember-basic-dropdown/components/basic-dropdown-wormhole';
import pageTitle from 'ember-page-title/helpers/page-title';
import Route from 'ember-route-template';

import { Shell } from '@universal-ember/docs-support';

export default Route(
  <template>
    <Shell>
      {{pageTitle "ember-native"}}

      {{outlet}}
    </Shell>
    <BasicDropdownWormhole />
  </template>
);
