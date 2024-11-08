import Router from '@ember/routing/router';


Router.map(function () {
  this.route('index', { path: '/' })
  this.route('test')
});

export default Router;
