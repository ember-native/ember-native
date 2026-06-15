const path = require('node:path');

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

        // Write the virtual module using the passed instance
        virtualModules.writeModule(modulePath, content || '// Empty virtual module\nmodule.exports = {};');
        virtualModules.writeModule(result.id, content || '// Empty virtual module\nmodule.exports = {};');
        console.log(`✓ Created virtual module: ${modulePath}`);
        console.log(`✓ Created virtual module: ${result.id}`);
      } else {
        console.warn(`Failed to create virtual module ${modulePath}:`, 'could not resolve');
      }
    } catch (err) {
      console.warn(`Failed to create virtual module ${modulePath}:`, err.message);
    }
    virtualModules.writeModule('./test.js', '// Empty virtual module\nmodule.exports = {};')
    virtualModules.writeModule(path.resolve(process.cwd(), 'test.js'), '// Empty virtual module\nmodule.exports = {};')
    virtualModules.writeModule(path.resolve(process.cwd(), 'app', 'test.js'), '// Empty virtual module\nmodule.exports = {};')
  });

  await Promise.all(promises);
}
