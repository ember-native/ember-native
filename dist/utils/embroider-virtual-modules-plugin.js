const path = require('node:path');
const fs = require('node:fs');

const APP_MODULES_TO_EXCLUDE = ['boot', 'test'];

let resolverPlugin;

// Virtual modules that are always registered by ember-native.
const DEFAULT_VIRTUAL_MODULE_PATHS = [
  '@embroider/virtual/compat-modules',
  '-embroider-implicit-modules.js'
];

try {
  const { resolver } = require('@embroider/vite');
  resolverPlugin = resolver();
} catch (e) {
  console.warn('Failed to load @embroider/vite resolver plugin:', e.message);
}

module.exports = async function registerEmbroiderVirtualModules(virtualModules, additionalVirtualModules = []) {
  // Merge the built-in virtual modules with any provided by the end user,
  // de-duplicating so a user-supplied path can't be registered twice.
  const virtualModulePaths = [
    ...DEFAULT_VIRTUAL_MODULE_PATHS,
    ...additionalVirtualModules,
  ].filter((modulePath, index, all) => all.indexOf(modulePath) === index);

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

        // Write the virtual module using the passed instance. We intentionally do
        // NOT also register a copy under `app/<modulePath>`: NativeScript's virtual
        // entry point does a `require.context('~/', true, ...)` scan over the app
        // directory, and webpack-virtual-modules cannot fully synthesize `lstat`
        // for the synthetic intermediate directories (e.g. `app/@embroider`) that
        // an app-relative registration would imply, causing a nondeterministic
        // ENOENT depending on which virtual module was registered last.
        virtualModules.writeModule(modulePath, finalContent);
        virtualModules.writeModule(result.id, finalContent);

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
