const glimmerOwnerPath = require.resolve('@glimmer/component/addon/-private/owner.ts', {
  paths: [process.cwd()]
});
module.exports = function (source, ...args) {
  if (
    this.resourcePath === glimmerOwnerPath
  ) {
    console.log('found', this.resourcePath);
    return "export { setOwner } from '@ember/application';";
  }
  return source;
};
