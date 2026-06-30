const path = require('node:path');
const fs = require('node:fs');

const APP_MODULES_TO_EXCLUDE = ['boot', 'test'];

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
          const packageJsonPath = path.resolve(process.cwd(), 'package.json');
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const modulePrefix = packageJson.name;
          const excludedModuleVars = new Map();

          for (const moduleName of APP_MODULES_TO_EXCLUDE) {
            const namespaceImportPattern = new RegExp(
              `^\\s*import\\s+\\*\\s+as\\s+([A-Za-z_$][\\w$]*)\\s+from\\s+["']\\./${moduleName}\\.js["'];?\\s*$`,
              'gm'
            );

            content = content.replace(namespaceImportPattern, (_match, variableName) => {
              excludedModuleVars.set(moduleName, variableName);
              return '';
            });

            const sideEffectImportPattern = new RegExp(
              `^\\s*import\\s+["']\\./${moduleName}\\.js["'];?\\s*$`,
              'gm'
            );

            content = content.replace(sideEffectImportPattern, '');
          }

          for (const [moduleName, variableName] of excludedModuleVars) {
            content = content.replace(
              new RegExp(`^\\s*["']${modulePrefix}/${moduleName}["']\\s*:\\s*${variableName},?\\s*$`, 'gm'),
              ''
            );
          }
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
