import Component from '@glimmer/component';

export class VersionSelector extends Component {

  async fetchVersions() {
    const result = await (await fetch('https://api.github.com/repos/ember-native/ember-native/contents/versions?ref=ember-native-docs')).json();
    return result.map(r => r.name);
  }

  <template></template>
}
