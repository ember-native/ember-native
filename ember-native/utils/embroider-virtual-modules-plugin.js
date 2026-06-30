const path = require('node:path');
const fs = require('node:fs');

let resolverPlugin;

try {
  const { resolver } = require('@embroider/vite');
  resolverPlugin = resolver();
} catch (e) {
  console.warn('Failed to load @embroider/vite resolver plugin:', e.message);
}

module.exports = async function registerEmbroiderVirtualModules(virtualModules) {
  const virtualModulePaths = [
    '@embroider/virtual/compat-modules',
    '-embroider-implicit-modules.js'
  ];

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

  // Initialize each virtual module
  const promises = virtualModulePaths.map(async (modulePath) => {
    try {
      // Resolve the virtual module with embroider's resolver
      const issuer = path.resolve(process.cwd(), 'package.json');
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

        if (typeof content === 'string') {
          content = content
            .replace(
              /^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+["']\.\/test\.js["'];?\s*$/gm,
              'const $1 = {};'
            )
            .replace(/^\s*import\s+['"]\.\/test\.js['"];\s*$/gm, '')
            .replace(/^\s*import\s+['"]\.\/test\.js['"]\s*$/gm, '');
        }

        const finalContent = content || '// Empty virtual module\nmodule.exports = {};';
        const appRelativeModulePath = path.resolve(process.cwd(), 'app', modulePath);

        // Write the virtual module using the passed instance
        virtualModules.writeModule(modulePath, finalContent);
        virtualModules.writeModule(result.id, finalContent);

        if (!fs.existsSync(appRelativeModulePath)) {
          virtualModules.writeModule(appRelativeModulePath, finalContent);
          console.log(`✓ Created virtual module: ${appRelativeModulePath}`);
        }

        console.log(`✓ Created virtual module: ${modulePath}`);
        console.log(`✓ Created virtual module: ${result.id}`);
      } else {
        console.warn(`Failed to create virtual module ${modulePath}:`, 'could not resolve');
      }
    } catch (err) {
      console.warn(`Failed to create virtual module ${modulePath}:`, err.message);
    }
  });

  await Promise.all(promises);
}
