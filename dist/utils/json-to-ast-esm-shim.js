// json-to-ast (a @warp-drive/json-api dependency, imported as
// `import jsonToAst from 'json-to-ast'`) ships a pre-Rollup UMD bundle with
// internal nested `require()` calls (its own vendored grapheme-splitter
// helper). @rollup/plugin-commonjs (wired up by @nativescript/vite) responds
// to that by wrapping it in its lazy "withRequireFunction" mode instead of
// emitting a static `default` export - real consumers are meant to go through
// a synthetic entry-proxy module that this plugin's own `resolveId` hook
// generates for exactly this case, but @embroider/vite's resolver has
// `enforce: 'pre'` and always claims bare-specifier resolution first,
// so the entry-proxy is never created and the bare `import jsonToAst from
// 'json-to-ast'` in @warp-drive/json-api binds directly to the real
// `build.js`, which only exports `__require` - hence a build-time
// "'default' is not exported by json-to-ast" error, not a runtime one.
//
// This shim reimplements that same entry-proxy by hand: `build.js`'s
// `__require` export is real (added by @rollup/plugin-commonjs's `transform`
// hook, which runs on file content regardless of who resolved the id), so
// calling it here gives us the real CJS `module.exports` value, which we can
// then re-export as a normal static `default`. Aliased from `json-to-ast` in
// vite.config.js so every bare import resolves here instead.
import { __require } from 'json-to-ast/build.js';

export default __require();
