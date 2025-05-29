function hmr() {
  return {
    name: 'hmr-plugin',

    transform(source, resourcePath) {
      if (process.env['EMBER_HMR_ENABLED'] !== 'true') {
        return source;
      }
      const supportedPaths = ['routers', 'controllers', 'routes', 'templates'];
      const supportedFileNames = [
        'route.js',
        'route.ts',
        'route.gts',
        'route.gjs',
        'controller.js',
        'controller.ts',
      ];
      if (resourcePath.includes('/-components/')) {
        return source;
      }
      if (
        !supportedPaths.some((s) => resourcePath.includes(`/${s}/`)) &&
        !supportedFileNames.some((s) => resourcePath.endsWith(s))
      ) {
        return source;
      }
      if (
        supportedPaths.includes('templates') &&
        supportedPaths.includes('components')
      ) {
        return source;
      }
      return `${source}
  if (import.meta.hot && window.emberHotReloadPlugin) {
      const result = window.emberHotReloadPlugin.canAcceptNew(import.meta.url);
      result.then(() => {
        if (!result) {
          import.meta.hot.decline();
        } else {
          import.meta.hot.accept()
        }
      });
  }
  `;
    },
  };
}

const hmrPlugin = hmr();

module.exports = function (source) {
  return hmrPlugin.transform(source, this.resourcePath);
};
