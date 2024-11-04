import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import PowerSelect from 'ember-power-select/components/power-select';
import pkg from 'docs-app/package.json';
import config from 'docs-app/config/environment';

export class VersionSelector extends Component {
  @tracked promise;
  @tracked selected = pkg.version;

  async fetchVersions() {
    const result = await (await fetch('https://api.github.com/repos/ember-native/ember-native/contents/versions?ref=ember-native-docs')).json();
    return result.map(r => r.name);
  }

  load = () => {
    this.promise = this.fetchVersions();
  }

  changeVersion = (ver) => {
    window.location = config.rootURL
      .split('/')
      .slice(0, -1)
      .concat([ver])
      .join('/');
  }

  <template>
    {{this.load}}
    <PowerSelect 
      @options={{this.promise}}
      @selected={{this.selected}}
      @labelText="loading versions"
      @onChange={{this.changeVersion}} as |name|>
        {{name}}
    </PowerSelect>
  </template>
}
