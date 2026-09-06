# Rad List View Component

Wraps `nativescript-ui-listview`'s `RadListView`, adding optional header and
footer blocks:

```gts
import { RadListView } from "ember-native/components";

<template>
  <RadListView height="100%" @items={{this.list}}>
    <:header><label>header</label></:header>
    <:item as |item|>
      <label>
        {{item}}
      </label>
    </:item>
    <:footer><label>footer</label></:footer>
  </RadListView>
</template>
```

A fuller example, as a route's page:

```gts
import { RadListView } from "ember-native/components";
import { on } from "@ember/modifier";
import { service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import Component from "@glimmer/component";
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
        <RadListView height="100%" @items={{this.list}}>
          <:header><label>header</label></:header>
          <:item as |item|>
            <label>
              {{item}}
            </label>
          </:item>
          <:footer><label>footer</label></:footer>
        </RadListView>
      </stack-layout>
    </page>
  </template>
}

export default Page;
```

`RadListView` isn't registered as a native element by default - register it
yourself first, see [Integrate plugin elements](../2-dom/integrate-plugin-elements).
