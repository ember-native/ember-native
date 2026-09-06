# List View Component

```gts
import { ListView } from "ember-native/components";

<template>
  <ListView height="100%" @items={{this.list}}>
    <:item as |item|>
      <label>
        {{item}}
      </label>
    </:item>
  </ListView>
</template>
```

`@items` accepts any array; give the `ListView` an explicit `height` (as
above) - without one, NativeScript never lays out/realizes any rows.

A fuller example, as a route's page:

```gts
import { ListView } from "ember-native/components";
import { on } from "@ember/modifier";
import { service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import Component from "@glimmer/component";
import RoutableComponentRoute from "ember-routable-component";
import type HistoryService from "ember-native/services/history";

class Page extends Component {
  @service("ember-native/history") history!: HistoryService;
  @tracked list = ["a", "b", "c"];

  constructor(...args: ConstructorParameters<typeof Component>) {
    super(...args);
    const lists = [
      ["a", "b", "c"],
      ["a", "b", "c", "d", "e"],
      ["1", "2", "3"],
      ["1", "2", "3", "4", "5"],
    ];
    setInterval(() => {
      this.list = lists[Math.floor(Math.random() * lists.length)];
    }, 200);
  }

  <template>
    <page>
      <action-bar title="MyApp">
        <navigation-button
          {{on "tap" this.history.back}}
          visibility="{{if this.history.stack.length 'visible' 'collapse'}}"
          android.position="left"
          text="Go back"
          android.systemIcon="ic_menu_back"
        />
      </action-bar>
      <stack-layout>
        <label text="Hello world!"></label>
        <ListView height="100%" @items={{this.list}}>
          <:item as |item|>
            <label>
              {{item}}
            </label>
          </:item>
        </ListView>
      </stack-layout>
    </page>
  </template>
}

export default class IndexRoute extends RoutableComponentRoute(Page) {}
```

See [Testing page-rooted components](../6-testing) for how a `<page>`-rooted
component like this one gets exported as an actual `Route`, and
[Sub-routes and back navigation](../4-router-transitions/frame-outlet) for
`history`/navigating to a nested route.
