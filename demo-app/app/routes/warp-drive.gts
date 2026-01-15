import RoutableComponentRoute from 'ember-routable-component';
import type HistoryService from 'ember-native/services/history';
import { on } from "@ember/modifier";
import { fn } from "@ember/helper";
import { service } from "@ember/service";
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import type Store from '@warp-drive/core/store';
import type { User } from '../schemas/user';

class Page extends Component {
  @service('ember-native/history') history!: HistoryService;
  @service declare store: Store;
  @tracked users: User[] = [];
  @tracked selectedUser: User | null = null;

  constructor(owner: unknown, args: {}) {
    super(owner, args);
    this.loadUsers();
  }

  loadUsers = () => {
    // Create some sample users using WarpDrive's store.push()
    const userData = [
      { id: '1', name: 'Alice Johnson', email: 'alice@example.com', age: 28 },
      { id: '2', name: 'Bob Smith', email: 'bob@example.com', age: 34 },
      { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', age: 42 },
      { id: '4', name: 'Diana Prince', email: 'diana@example.com', age: 31 },
    ];

    // Use store.push() with proper JSON:API format
    this.users = userData.map(data => 
      this.store.push({
        data: {
          type: 'user',
          id: data.id,
          attributes: {
            name: data.name,
            email: data.email,
            age: data.age
          }
        }
      }) as User
    );
  };

  selectUser = (user: User) => {
    this.selectedUser = user;
  };

  clearSelection = () => {
    this.selectedUser = null;
  };

  <template>
    <page>
      <action-bar title="WarpDrive Demo">
        <navigation-button
          {{on 'tap' this.history.back}}
          visibility="{{if this.history.stack.length 'visible' 'collapse'}}"
          android.position="left"
          text="Go back"
          android.systemIcon="ic_menu_back"
        />
      </action-bar>
      <stack-layout>
        <label class="h2 text-center m-4" text="WarpDrive (Ember Data) Demo" />
        <label class="text-center m-2" text="Using @warp-drive/schema-record with proper store integration" />
        
        {{#if this.selectedUser}}
          <stack-layout class="m-4 p-4 bg-gray-100">
            <label class="h3 mb-2" text="Selected User Details:" />
            <label text="ID: {{this.selectedUser.id}}" />
            <label text="Name: {{this.selectedUser.name}}" />
            <label text="Email: {{this.selectedUser.email}}" />
            <label text="Age: {{this.selectedUser.age}}" />
            <button 
              class="btn btn-primary mt-4" 
              text="Clear Selection" 
              {{on 'tap' this.clearSelection}}
            />
          </stack-layout>
        {{else}}
          <label class="text-center m-2" text="Tap a user to see details:" />
        {{/if}}

        <scroll-view>
          <stack-layout>
            {{#each this.users as |user|}}
              <stack-layout 
                class="m-2 p-3 bg-white border-b"
                {{on 'tap' (fn this.selectUser user)}}
              >
                <label class="font-bold" text="{{user.name}}" />
                <label class="text-sm text-gray-600" text="{{user.email}}" />
                <label class="text-xs text-gray-500" text="Age: {{user.age}}" />
              </stack-layout>
            {{/each}}
          </stack-layout>
        </scroll-view>
      </stack-layout>
    </page>
  </template>
}

// Generate a Route class using the provided template
export default class WarpDriveRoute extends RoutableComponentRoute(Page) {
  activate() {
    console.log('WarpDrive route activated with modern store integration');
  }
}