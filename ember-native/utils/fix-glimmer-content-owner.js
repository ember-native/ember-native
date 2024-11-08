
module.exports = function (source, ...args) {
  if (this.resourcePath === require.resolve('@glimmer/component/addon/-private/owner.ts')) {
    console.log('found', this.resourcePath)
    return 'export { setOwner } from \'@ember/application\';'
  }
  return source;
}
