import Component from '@glimmer/component';
import PowerSelect from 'ember-power-select/components/power-select';

export class VersionSelector extends Component {

  async fetchVersions() {
    const result = await (await fetch('https://api.github.com/repos/ember-native/ember-native/contents/versions?ref=ember-native-docs')).json();
    return result.map(r => r.name);
  }

  load = () => {
    this.promise = this.fetchVersions();
  }

  <template>
    {{this.load}}
    <PowerSelect >
    </PowerSelect>
  </template>
}
