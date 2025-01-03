import 'ember-mobile-menu/themes/android';
import './layout.css';

import pageTitle from 'ember-page-title/helpers/page-title';
import { colorScheme } from 'ember-primitives/color-scheme';
import Route from 'ember-route-template';
import BasicDropdownWormhole from 'ember-basic-dropdown/components/basic-dropdown-wormhole';

const Application = <template>
  {{pageTitle "ember-native"}}
  {{(syncBodyClass)}}

  {{outlet}}
  <BasicDropdownWormhole />
</template>;

export default Route(Application);

function isDark() {
  return colorScheme.current === 'dark';
}

function syncBodyClass() {
  if (isDark()) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}
