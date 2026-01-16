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
  @tracked isLoading = false;
  @tracked error: string | null = null;

  constructor(owner: unknown, args: {}) {
    super(owner, args);
    this.loadUsers();
  }

  loadUsers = async (forceReload = false) => {
    this.isLoading = true;
    this.error = null;

    try {
      // Add artificial delay to demonstrate loading state
      if (forceReload) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Use store.request() instead of fetch() + store.push()
      const { content } = await this.store.request<{ data: User[] }>({
        url: 'https://raw.githubusercontent.com/ember-native/ember-native/main/demo-app/sample-data/users.json',
        method: 'GET',
        cacheOptions: {
          reload: forceReload, // Force reload when button is pressed
          backgroundReload: !forceReload, // Only background reload on initial load
          types: ['user']
        }
      });

      // The data is automatically pushed to the store's cache
      // We can access it directly from the response
      this.users = content.data || [];

    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load users';
      console.error('Error loading users:', err);
    } finally {
      this.isLoading = false;
    }
  };

  reloadUsers = () => {
    this.loadUsers(true);
  };

  selectUser = (user: User) => {
    this.selectedUser = user;
  };

  clearSelection = () => {
    this.selectedUser = null;
  };

  <template>
    <page class="page">
      <action-bar title="WarpDrive Demo" class="action-bar">
        <navigation-button
          {{on 'tap' this.history.back}}
          visibility="{{if this.history.stack.length 'visible' 'collapse'}}"
          android.position="left"
          text="Back"
          android.systemIcon="ic_menu_back"
        />
      </action-bar>

      <grid-layout rows="auto, *" class="page-content">
        <!-- Header Section -->
        <stack-layout row="0" class="header-section">
          <label class="page-title" text="🚀 WarpDrive Demo" />
          <label class="page-subtitle" text="Powered by Ember Data v5" />
          <label class="page-description" text="Fetching data with store.request()" textWrap="true" />
        </stack-layout>

        <!-- Content Section -->
        <stack-layout row="1">
          {{#if this.isLoading}}
            <stack-layout class="loading-container">
              <activity-indicator busy="true" class="activity-indicator" />
              <label class="loading-text" text="Loading users from GitHub..." />
            </stack-layout>
          {{else if this.error}}
            <stack-layout class="error-container">
              <label class="error-icon" text="⚠️" />
              <label class="error-title" text="Oops! Something went wrong" />
              <label class="error-message" text="{{this.error}}" textWrap="true" />
              <button
                class="btn btn-primary retry-button"
                text="🔄 Try Again"
                {{on 'tap' this.loadUsers}}
              />
            </stack-layout>
          {{else}}
            {{#if this.selectedUser}}
              <scroll-view>
                <stack-layout class="user-detail-container">
                  <label class="detail-header" text="👤 User Profile" />

                  <stack-layout class="detail-card">
                    <label class="user-name" text="{{this.selectedUser.name}}" />
                    <label class="user-email" text="📧 {{this.selectedUser.email}}" />
                    <label class="user-age" text="🎂 Age: {{this.selectedUser.age}}" />

                    {{#if this.selectedUser.bio}}
                      <stack-layout class="bio-section">
                        <label class="bio-label" text="About" />
                        <label class="bio-text" text="{{this.selectedUser.bio}}" textWrap="true" />
                      </stack-layout>
                    {{/if}}
                  </stack-layout>

                  <button
                    class="btn btn-outline back-button"
                    text="← Back to List"
                    {{on 'tap' this.clearSelection}}
                  />
                </stack-layout>
              </scroll-view>
            {{else}}
              <stack-layout>
                <stack-layout class="list-header">
                  <label class="user-count" text="{{this.users.length}} Users Loaded" />
                  <label class="list-instruction" text="Tap any user to view details" />
                  <button
                    class="btn btn-primary reload-button"
                    text="🔄 Reload Data"
                    {{on 'tap' this.reloadUsers}}
                  />
                </stack-layout>

                <scroll-view>
                  <stack-layout class="user-list">
                    {{#each this.users as |user|}}
                      <grid-layout
                        columns="auto, *"
                        class="user-card"
                        {{on 'tap' (fn this.selectUser user)}}
                      >
                        <label col="0" class="user-avatar" text="👤" />
                        <stack-layout col="1" class="user-info">
                          <label class="user-card-name" text="{{user.name}}" />
                          <label class="user-card-email" text="{{user.email}}" />
                          <label class="user-card-age" text="Age: {{user.age}}" />
                          {{#if user.bio}}
                            <label class="user-card-bio" text="{{user.bio}}" textWrap="true" />
                          {{/if}}
                        </stack-layout>
                      </grid-layout>
                    {{/each}}
                  </stack-layout>
                </scroll-view>
              </stack-layout>
            {{/if}}
          {{/if}}
        </stack-layout>
      </grid-layout>
    </page>
  </template>
}

// Generate a Route class using the provided template
export default class WarpDriveRoute extends RoutableComponentRoute(Page) {
  activate() {
    console.log('WarpDrive route activated - using store.request() to fetch from GitHub');
  }
}
