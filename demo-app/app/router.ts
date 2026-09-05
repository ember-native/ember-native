import Router from '@ember/routing/router';


Router.map(function () {
  this.route('index', { path: '/' })
  this.route('list-view', function () {
    this.route('item', { path: ':index' })
  })
  this.route('rad-list-view')
  this.route('tabs')
  this.route('warp-drive')
});

export default Router;
