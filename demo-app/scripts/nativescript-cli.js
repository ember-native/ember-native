#!/usr/bin/env node
'use strict';

// Runtime monkeypatch for a real upstream `nativescript` CLI bug (see
// VITE_MIGRATION_NOTES.md, "A real, upstream `nativescript` CLI bug: `build`/`test`
// never copy the Vite output"): `BundlerCompilerService.compileWithoutWatch` - the
// path used by any non-watch invocation, i.e. `nativescript build`/`test` - never
// copies Vite's `.ns-vite-build` output into the native platform project, unlike
// `debug`'s watch-mode path (`compileWithWatch`) which does.
//
// Previously fixed via `pnpm patch nativescript@9.0.6`, but the whole `nativescript`
// package is too large to fork like `unit-test-runner`/`karma-nativescript-launcher`
// were, and it runs in the host CLI process rather than through Vite's build
// pipeline, so it can't be fixed with a Vite transform plugin either (see
// `ember-native/utils/vite-dependency-patches.js` for that approach on the
// dependencies where it *does* apply). Instead, this wrapper requires the CLI
// in-process after patching the class's prototype in memory, forwarding argv
// unchanged - invoked in place of the `nativescript`/`tns` bin everywhere (see
// package.json scripts and `.github/workflows/app-test.yml`).
//
// If `nativescript`/`@nativescript/vite` fix this upstream, this file (and its
// callers) can be deleted and replaced with a plain `nativescript` bin call again.

const path = require('path');

// `bundler-compiler-service.js` decorates some of its methods with
// `@performanceLog()`-style decorators that resolve services (e.g.
// `performanceService`) from the CLI's Yok DI container *eagerly*, at class
// definition time - not lazily, at method-call time. `nativescript/lib/bootstrap`
// is what registers every service (including this one) with that container;
// requiring it first ensures the container can actually resolve those
// dependencies when this file's decorators run, instead of throwing "unable to
// resolve performanceService". `bin/tns` (required below) does this same
// `require('./bootstrap')` internally too - Node's module cache makes the
// second require here a no-op, so this doesn't change the CLI's own behavior.
require('nativescript/lib/bootstrap');

const {
  BundlerCompilerService,
} = require('nativescript/lib/services/bundler/bundler-compiler-service');

const originalCompileWithoutWatch = BundlerCompilerService.prototype.compileWithoutWatch;

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

require('nativescript/bin/tns');
