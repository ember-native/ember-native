#!/usr/bin/env node
'use strict';

// Wrapper around the `nativescript` CLI that works around a real upstream bug:
// `BundlerCompilerService.compileWithoutWatch` - the path used by every
// non-watch CLI invocation (`nativescript build`/`test`) - never copies the
// `@nativescript/vite` build output into the native platform project, unlike
// `debug`'s watch-mode path (`compileWithWatch`), which does. Without this,
// `build`/`test` silently produce an empty (or stale) native app.
//
// Not yet fixed in any released `nativescript` version as of this writing
// (still broken in the latest stable, `9.0.6`), though the fix already exists
// upstream in prerelease builds (confirmed by reading `9.0.7-next.*`'s own
// `compileWithoutWatch` source directly, which already calls
// `copyViteBundleToNative` itself) - see the feature-detection below, which
// makes this wrapper a no-op the moment that fix reaches a version you use.
//
// Shipped as a real published binary (`ember-native-nativescript`, this
// package's `bin` entry) rather than kept as a private script local to one
// app: any consuming app using `@nativescript/vite` hits this exact bug, not
// just this repo's own `demo-app`. Point your `build`/`test`/`debug`/`run`/
// `prepare` package.json scripts at `ember-native-nativescript` instead of
// `nativescript`/`tns` directly - it forwards argv unchanged and otherwise
// behaves identically.
//
// Must be run with the consuming app's project directory as `cwd` (same as
// `nativescript` itself would be) - `nativescript` is resolved from there,
// not from wherever this package happens to be installed, since a v2 addon
// like `ember-native` never depends on `nativescript` itself.

function resolveFromProject(request) {
  return require.resolve(request, { paths: [process.cwd()] });
}

require(resolveFromProject('nativescript/lib/bootstrap'));

const {
  BundlerCompilerService,
} = require(resolveFromProject('nativescript/lib/services/bundler/bundler-compiler-service'));

const originalCompileWithoutWatch = BundlerCompilerService.prototype.compileWithoutWatch;

// Feature-detect rather than hardcode a version cutoff: once upstream ships
// the real fix, `compileWithoutWatch`'s own source already calls
// `copyViteBundleToNative` itself, and patching on top of that would copy
// twice. Skip the monkeypatch entirely the moment that's true, whatever
// version it first ships in.
const upstreamAlreadyFixed = originalCompileWithoutWatch
  .toString()
  .includes('copyViteBundleToNative');

if (!upstreamAlreadyFixed) {
  const path = require('path');

  BundlerCompilerService.prototype.compileWithoutWatch = async function patchedCompileWithoutWatch(
    platformData,
    projectData,
    prepareData
  ) {
    await originalCompileWithoutWatch.call(this, platformData, projectData, prepareData);

    if (this.getBundler() === 'vite') {
      const distOutput = path.join(projectData.projectDir, '.ns-vite-build');
      const destDir = path.join(
        platformData.appDestinationDirectoryPath,
        this.$options.hostProjectModuleName
      );
      this.copyViteBundleToNative(distOutput, destDir);
    }
  };
}

require(resolveFromProject('nativescript/bin/tns'));
