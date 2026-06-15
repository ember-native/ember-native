/**
 * Webpack plugin that provides virtual modules from @embroider/vite's resolver
 * Uses webpack-virtual-modules to create in-memory modules
 */

const VirtualModulesPlugin = require('webpack-virtual-modules');
const path = require('path');

let resolverPlugin;

try {
  const { resolver } = require('@embroider/vite');
  resolverPlugin = resolver();
} catch (e) {
  console.warn('Failed to load @embroider/vite resolver plugin:', e.message);
}

class EmbroiderVirtualModulesPlugin {
  constructor(virtualModules) {
    this.virtualModules = virtualModules;
    this.initialized = false;
    console.log('EmbroiderVirtualModulesPlugin: Constructor called');
  }

  apply(compiler) {
    console.log('EmbroiderVirtualModulesPlugin: apply() called');
    
    if (!resolverPlugin) {
      console.warn('EmbroiderVirtualModulesPlugin: No resolver plugin available');
      return;
    }
    
    if (!this.virtualModules) {
      console.error('EmbroiderVirtualModulesPlugin: No virtualModules instance provided');
      return;
    }

    // Create a context for the resolver plugin
    const pluginContext = {
      parse: (code) => ({ code }),
      emitFile: () => {},
      resolve: async (source, importer, options) => {
        if (resolverPlugin.resolveId) {
          return await resolverPlugin.resolveId.call(pluginContext, source, importer, options || {});
        }
        return null;
      },
    };

    // Wait for the compiler to be ready before writing virtual modules
    compiler.hooks.beforeCompile.tapAsync('EmbroiderVirtualModulesPlugin', (params, callback) => {
      if (this.initialized) {
        callback();
        return;
      }
      
      console.log('EmbroiderVirtualModulesPlugin: Initializing virtual modules...');
      
      // List of known virtual modules from @embroider/virtual
      const virtualModulePaths = [
        '@embroider/virtual/compat-modules',
        '@embroider/virtual/vendor.js',
        '@embroider/virtual/vendor.css',
        '@embroider/virtual/test-support.js',
        '@embroider/virtual/test-support.css'
      ];

      // Initialize each virtual module
      const promises = virtualModulePaths.map(async (modulePath) => {
        try {
          // Resolve the virtual module with embroider's resolver
          const issuer = path.resolve(compiler.context, 'package.json');
          const result = await resolverPlugin.resolveId.call(pluginContext, modulePath, issuer, {});
          
          if (result && result.id) {
            // Get the content using the load hook
            let content = '';
            if (resolverPlugin.load) {
              const loadResult = resolverPlugin.load.call(pluginContext, result.id);
              if (loadResult) {
                content = loadResult;
              }
            }
            
            // Write the virtual module using the passed instance
            const virtualPath = path.join('node_modules', modulePath);
            this.virtualModules.writeModule(virtualPath, content || '// Empty virtual module\nmodule.exports = {};');
            console.log(`✓ Created virtual module: ${modulePath}`);
          }
        } catch (err) {
          console.warn(`Failed to create virtual module ${modulePath}:`, err.message);
        }
      });

      Promise.all(promises)
        .then(() => {
          this.initialized = true;
          callback();
        })
        .catch((err) => {
          console.error('Error initializing virtual modules:', err);
          callback(err);
        });
    });
  }
}

module.exports = EmbroiderVirtualModulesPlugin;
