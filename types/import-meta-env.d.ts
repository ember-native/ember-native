// Minimal shape of Vite's `import.meta.env`, matching `vite/client`'s
// relevant subset - this addon's source is bundled directly by whichever
// Vite config a consuming app supplies (via `ember-native/utils/nativescript-vite.config.js`),
// so `import.meta.env.DEV` is a real build-time constant there, not just an
// app-side convention. Declared locally instead of depending on the `vite`
// package just for its ambient types.
interface ImportMetaEnv {
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
