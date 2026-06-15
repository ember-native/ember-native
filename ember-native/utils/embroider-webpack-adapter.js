

/**
 * Webpack adapter for @embroider/vite plugins
 *
 * This adapter allows using @embroider/vite's resolver() and templateTag() plugins
 * in webpack builds, similar to how they're used in rollup.config.mjs
 */

const path = require('path');
const fs = require('fs');
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
          return fs.realpathSync(fullPath);
        }
        // eslint-disable-next-line no-unused-vars
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
        // eslint-disable-next-line no-unused-vars
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
  const virtualModulesLoader = require('./embroider-virtual-modules-loader.js');

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
          const issuer = request.context?.issuer || request.path;

          if (!request.context?.issuer) {
            callback();
            return;
          }

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
                if (spec.startsWith('ember-source')) {
                  return { id: fs.realpathSync(require.resolve(spec)) };
                }
                from = fs.realpathSync(from);
                return { id: fs.realpathSync(require.resolve(spec, { paths: [path.dirname(from)] })) };
                // eslint-disable-next-line no-unused-vars
              } catch (e) {
                return null;
              }
            }
          };

          // Call resolveId from the resolver plugin
          Promise.resolve()
            .then(async () => {
              if (resolverPlugin.resolveId) {
                const result = await resolverPlugin.resolveId.call(context, request.request, issuer, {});

                // If this is a virtual module that embroider resolved, we need to ensure
                // webpack can find it by creating a resolvable path
                if (result && result.meta && result.meta['embroider-resolver'] && result.meta['embroider-resolver'].virtual) {
                  // Store the metadata so the loader can access it
                  virtualModulesLoader.setResponseMeta(request.request, result.meta['embroider-resolver']);

                  // Return a path that webpack can resolve - we'll use the original request
                  // The loader will intercept this and provide the virtual content
                  return {
                    ...result,
                    id: request.request
                  };
                }

                return result;
              }
              return null;
            })
            .then((result) => {
              if (result && result.id) {
                // Store metadata for virtual modules loader
                if (result.meta && result.meta['embroider-resolver']) {
                  const normalizedId = result.id.replace(/\\/g, '/');
                  virtualModulesLoader.setResponseMeta(normalizedId, result.meta['embroider-resolver']);

                  // For virtual modules, store with the original request path too
                  if (result.meta['embroider-resolver'].virtual) {
                    virtualModulesLoader.setResponseMeta(request.request, result.meta['embroider-resolver']);
                  }
                }

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
            // eslint-disable-next-line no-unused-vars
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
  const WebpackVirtualModules = require('webpack-virtual-modules');
  const EmbroiderVirtualModulesPlugin = require('./embroider-virtual-modules-plugin.js');
  
  // Create the virtual modules plugin instance
  const virtualModules = new WebpackVirtualModules();

  webpack.chainWebpack((config) => {
    // Register webpack-virtual-modules plugin first
    config
      .plugin('webpack-virtual-modules')
      .use(virtualModules);
    
    // Register our custom plugin that will populate the virtual modules
    config
      .plugin('embroider-virtual-modules')
      .use(EmbroiderVirtualModulesPlugin, [virtualModules]);

    // Add resolver plugin if available
    if (ResolverPlugin) {
      config.resolve
        .plugin('embroider-resolver')
        .use(ResolverPlugin);
    }

    // Configure .gts/.gjs file handling using the embroider-template-tag-loader
    // This loader wraps @embroider/vite's templateTag() plugin
    const templateTagLoaderPath = path.resolve(__dirname, 'embroider-template-tag-loader.js');

    config.module
      .rule('gts/gjs')
      .test(/\.g[jt]s$/)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('embroider-template-tag-loader')
      .loader(templateTagLoaderPath)
      .end();

    // Configure regular .js/.ts files
    config.module
      .rule('js/ts')
      .test(/\.([jt]s)$/)
      .use('babel-loader')
      .loader('babel-loader')
      .end();
  });
};

module.exports.createResolverPlugin = createResolverPlugin;
