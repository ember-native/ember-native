// Alias target for Node built-ins that socket.io-client's dependency chain
// (`ws`, `xmlhttprequest-ssl`, `debug`) references but never actually needs
// on NativeScript - see vite.test.config.ts's `resolve.alias` for why. Mirrors
// webpack.config.js's `resolve.fallback: { ...: false }` entries, which
// webpack treats as "resolve to an empty module" - Vite has no equivalent
// shorthand, so this is that empty module, spelled out.
export default {};
