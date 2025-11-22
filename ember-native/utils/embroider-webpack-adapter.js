/**
 * Webpack adapter for @embroider/vite plugins
 *
 * This adapter allows using @embroider/vite's resolver() and templateTag() plugins
 * in webpack builds, similar to how they're used in rollup.config.mjs
 */

const path = require('path');
const { existsSync, statSync } = require("fs");
const { resolve: resolvePath } = require("path");

function tryExtensions(basePath, extensions = ['js', 'ts', 'gts', '.gjs']) {
  // Try with extensions first
  basePath = basePath
    .replace('.js', '')
    .replace('.ts', '')
    .replace('.gjs', '')
    .replace('.gts', '')
    .replace('file://', '');
  for (const ext of extensions) {
    const fullPath = `${basePath}.${ext}`;
    if (existsSync(fullPath)) {
      try {
        const stats = statSync(fullPath);
        if (stats.isFile()) {
          return fullPath;
        }
      } catch (e) {
        // Continue to next extension
      }
    }
  }

  // Try index files
  for (const ext of extensions) {
    const indexPath = resolvePath(basePath, `index.${ext}`);
    if (existsSync(indexPath)) {
      try {
        const stats = statSync(indexPath);
        if (stats.isFile()) {
          return indexPath;
        }
      } catch (e) {
        // Continue to next extension
      }
    }
  }
  return null;
}

/**
 * Creates a webpack resolver plugin that uses @embroider/vite's resolver
 */
function createResolverPlugin() {
  let resolverPlugin;

  try {
    const { resolver } = require('@embroider/vite');
    resolverPlugin = resolver();
  } catch (e) {
    console.warn('Failed to load @embroider/vite resolver plugin:', e.message);
    return null;
  }

  return class EmbroiderResolverPlugin {
    apply(resolver) {
      const target = resolver.ensureHook('resolved');

      resolver
        .getHook('described-resolve')
        .tapAsync('EmbroiderResolverPlugin', (request, resolveContext, callback) => {
          const requestStr = request.request;
          const issuer = request.context?.issuer || request.path;

          // Create a context compatible with vite plugins
          // The resolver expects a context with a resolve method
          const context = {
            resolve: async (spec, from) => {
              // Return a simple object with id property
              // Let webpack handle the actual resolution
              const res = tryExtensions(spec);
              if (res) {
                return { id: res };
              }
              try {
                return { id: require.resolve(spec, { paths: [path.dirname(from)] }) };
              } catch (e) {
                return null;
              }
            }
          };

          // Call resolveId from the resolver plugin
          Promise.resolve()
            .then(() => {
              if (resolverPlugin.resolveId) {
                return resolverPlugin.resolveId.call(context, request.request, issuer, {});
              }
              return null;
            })
            .then((result) => {
              if (result && result.id) {
                // Embroider resolved it - continue with the resolved path
                const obj = {
                  ...request,
                  request: result.id,
                  path: result.id
                };
                resolver.doResolve(target, obj, null, resolveContext, callback);
              } else {
                // Embroider couldn't resolve it - let the next plugin try
                callback();
              }
            })
            .catch((error) => {
              callback();
            });
        });
    }
  };
}

/**
 * Configures webpack to use @embroider/vite plugins via adapters
 */
module.exports = function configureEmbroiderWebpackAdapter(webpack) {
  const ResolverPlugin = createResolverPlugin();

  webpack.chainWebpack((config) => {
    // Add resolver plugin if available
    if (ResolverPlugin) {
      config.resolve
        .plugin('embroider-resolver')
        .use(ResolverPlugin);
    }

    // Configure .gts/.gjs file handling using the embroider-template-tag-loader
    // This loader wraps @embroider/vite's templateTag() plugin
    const loaderPath = path.resolve(__dirname, 'embroider-template-tag-loader.js');

    config.module
      .rule('gts/gjs')
      .test(/\.g[jt]s$/)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('embroider-template-tag-loader')
      .loader(loaderPath)
      .end();

    // Configure regular .js/.ts files
    config.module
      .rule('js/ts')
      .test(/\.([jt]s)$/)
      .exclude
      .add(/node_modules/)
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .end();
  });
};

module.exports.createResolverPlugin = createResolverPlugin;
