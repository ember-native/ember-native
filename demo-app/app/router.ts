import Router from '@ember/routing/router';


Router.map(function () {
  this.route('index', { path: '/' })
  this.route('list-view')
  this.route('rad-list-view')
  this.route('tabs')
});

export default Router;
