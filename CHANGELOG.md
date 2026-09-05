# Changelog

## Release (2026-09-05)

* ember-native 5.1.0 (minor)

#### :rocket: Enhancement
* `ember-native`
  * [#443](https://github.com/ember-native/ember-native/pull/443) Add page stacks so navigating back and forth skips re-rendering ([@patricklx](https://github.com/patricklx))

#### :bug: Bug Fix
* `ember-native`
  * [#444](https://github.com/ember-native/ember-native/pull/444) Fix FrameElement.onInsertedChild not tracking currentPage ([@patricklx](https://github.com/patricklx))

#### :house: Internal
* [#446](https://github.com/ember-native/ember-native/pull/446) Fix demo app release-build blank content (ember-vite-hmr HMR gate) ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-08-24)

* ember-native 5.0.6 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#439](https://github.com/ember-native/ember-native/pull/439) perf(RadListView): keep cleanup off the hot recycle path, prune only on shrink ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-08-18)

* ember-native 5.0.5 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#435](https://github.com/ember-native/ember-native/pull/435) perf(RadListView): key rows by stable element, not item value ([@patricklx](https://github.com/patricklx))
  * [#433](https://github.com/ember-native/ember-native/pull/433) perf(ListView): use per-row TrackedMap tracking to fix fast-scroll lag ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-08-17)

* ember-native 5.0.4 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#431](https://github.com/ember-native/ember-native/pull/431) fix(RadListView): avoid backtracking-rerender assertion from TrackedMap.structure ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-08-16)

* ember-native 5.0.3 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#425](https://github.com/ember-native/ember-native/pull/425) Fix broken default-export _app_ reexport stubs for index barrel files ([@patricklx](https://github.com/patricklx))
  * [#426](https://github.com/ember-native/ember-native/pull/426) Add maybeSetupInspectorSupport as the safe inspector-support entrypoint ([@patricklx](https://github.com/patricklx))
  * [#428](https://github.com/ember-native/ember-native/pull/428) Add regression test + docs for textContent after a native tap ([@patricklx](https://github.com/patricklx))
  * [#429](https://github.com/ember-native/ember-native/pull/429) Add DocumentNode.getElementsByTagName/querySelector so Vite's preload helper stops crashing ([@patricklx](https://github.com/patricklx))
  * [#423](https://github.com/ember-native/ember-native/pull/423) Add withTemplateForTest helper + docs for testing <page>-rooted components ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-08-14)

* ember-native 5.0.2 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#419](https://github.com/ember-native/ember-native/pull/419) Add CI check for release build boot on demo app ([@patricklx](https://github.com/patricklx))
  * [#421](https://github.com/ember-native/ember-native/pull/421) Fix ActionBar <action-item> removal losing ActionItems bookkeeping ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-08-14)

* ember-native 5.0.1 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#418](https://github.com/ember-native/ember-native/pull/418) Fix Glimmer bridging bookkeeping in ListView/RadListView ([@patricklx](https://github.com/patricklx))
  * [#416](https://github.com/ember-native/ember-native/pull/416) Make earlyGlobalsBanner()'s placeholder document robust ([@patricklx](https://github.com/patricklx))
  * [#414](https://github.com/ember-native/ember-native/pull/414) Fix release-build boot crash for classes registered via @JavaProxy ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-08-02)

* ember-native 5.0.0 (major)
* karma-ember-native-launcher 1.0.0 (new)
* ember-native-unit-test-runner 1.0.0 (new)

#### :boom: Breaking Change
* `ember-native`
  * [#396](https://github.com/ember-native/ember-native/pull/396) Migrate demo-app from @nativescript/webpack to @nativescript/vite ([@patricklx](https://github.com/patricklx))

#### :tada: New Packages
* `karma-ember-native-launcher`, `ember-native-unit-test-runner`
  * [#396](https://github.com/ember-native/ember-native/pull/396) Migrate demo-app from @nativescript/webpack to @nativescript/vite ([@patricklx](https://github.com/patricklx))

#### :bug: Bug Fix
* `ember-native`
  * [#405](https://github.com/ember-native/ember-native/pull/405) Fix querySelector/getElementByTagName never matching a dashed tag name ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-07-31)

* ember-native 4.0.3 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#403](https://github.com/ember-native/ember-native/pull/403) Give window a real addEventListener and mark document ready at boot ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-07-31)

* ember-native 4.0.2 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#401](https://github.com/ember-native/ember-native/pull/401) Fix HistoryService#back() still reading stale RouteInfo params ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-07-30)

* ember-native 4.0.1 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#399](https://github.com/ember-native/ember-native/pull/399) Fix HistoryService#back() using stale params for routes with dynamic segments ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-07-25)

* ember-native 4.0.0 (major)

#### :boom: Breaking Change
* `ember-native`
  * [#393](https://github.com/ember-native/ember-native/pull/393) Upgrade NativeScript to 9.x (core, android, types, webpack, CLI) ([@patricklx](https://github.com/patricklx))

#### :rocket: Enhancement
* `ember-native`
  * [#398](https://github.com/ember-native/ember-native/pull/398) Replace pnpm patches with a custom webpack plugin ([@patricklx](https://github.com/patricklx))

#### :bug: Bug Fix
* `ember-native`
  * [#394](https://github.com/ember-native/ember-native/pull/394) Fix crash on Android hardware back button for routes without dynamic segments ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-07-22)

* ember-native 3.4.1 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#391](https://github.com/ember-native/ember-native/pull/391) Fix embroider implicit-modules resolution breaking consumer builds ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-07-07)

* ember-native 3.4.0 (minor)

#### :rocket: Enhancement
* `ember-native`
  * [#385](https://github.com/ember-native/ember-native/pull/385) enhance resolver with additional virtual modules ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-07-01)

* ember-native 3.3.0 (minor)

#### :rocket: Enhancement
* `ember-native`
  * [#379](https://github.com/ember-native/ember-native/pull/379) Support virtual modules ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-06-29)

* ember-native 3.2.2 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#374](https://github.com/ember-native/ember-native/pull/374) Pass full params object in transitionTo call ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-06-13)

* ember-native 3.2.1 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#362](https://github.com/ember-native/ember-native/pull/362) Export NativeElementNode from index.ts ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-06-12)

* ember-native 3.2.0 (minor)

#### :rocket: Enhancement
* `ember-native`
  * [#354](https://github.com/ember-native/ember-native/pull/354) update list view to support all params ([@patricklx](https://github.com/patricklx))
  * [#324](https://github.com/ember-native/ember-native/pull/324) add native-slot modifier ([@patricklx](https://github.com/patricklx))

#### :bug: Bug Fix
* `ember-native`
  * [#353](https://github.com/ember-native/ember-native/pull/353) remove listener as it could break other native listeners ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2026-01-16)

* ember-native 3.1.0 (minor)

#### :rocket: Enhancement
* `ember-native`
  * [#321](https://github.com/ember-native/ember-native/pull/321) support warp drive ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2025-12-05)

* ember-native 3.0.2 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#317](https://github.com/ember-native/ember-native/pull/317) move embroider vite to deps ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2025-12-03)

* ember-native 3.0.1 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#298](https://github.com/ember-native/ember-native/pull/298) make next/prev sibling getter ([@patricklx](https://github.com/patricklx))
  * [#297](https://github.com/ember-native/ember-native/pull/297) remove child before insert again ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2025-11-23)

* ember-native 3.0.0 (major)

#### :boom: Breaking Change
* `ember-native`
  * [#269](https://github.com/ember-native/ember-native/pull/269) improve webpack config ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2025-11-22)

* ember-native 2.2.1 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#268](https://github.com/ember-native/ember-native/pull/268) fix text node updates ([@patricklx](https://github.com/patricklx))

#### :house: Internal
* [#178](https://github.com/ember-native/ember-native/pull/178) Prepare Release ([@github-actions[bot]](https://github.com/apps/github-actions))

#### Committers: 2
- Patrick Pircher ([@patricklx](https://github.com/patricklx))
- [@github-actions[bot]](https://github.com/apps/github-actions)






## Release (2025-05-28)

* ember-native 2.2.0 (minor)

#### :rocket: Enhancement
* `ember-native`
  * [#174](https://github.com/ember-native/ember-native/pull/174) bump version ([@patricklx](https://github.com/patricklx))
* Other
  * [#136](https://github.com/ember-native/ember-native/pull/136) update astroturf ([@patricklx](https://github.com/patricklx))

#### :house: Internal
* [#172](https://github.com/ember-native/ember-native/pull/172) Prepare Release ([@github-actions[bot]](https://github.com/apps/github-actions))
* [#152](https://github.com/ember-native/ember-native/pull/152) update kolay ([@patricklx](https://github.com/patricklx))
* [#151](https://github.com/ember-native/ember-native/pull/151) update docs support ([@patricklx](https://github.com/patricklx))

#### Committers: 2
- Patrick Pircher ([@patricklx](https://github.com/patricklx))
- [@github-actions[bot]](https://github.com/apps/github-actions)

## Release (2025-05-28)



#### :rocket: Enhancement
* [#136](https://github.com/ember-native/ember-native/pull/136) update astroturf ([@patricklx](https://github.com/patricklx))

#### :house: Internal
* [#152](https://github.com/ember-native/ember-native/pull/152) update kolay ([@patricklx](https://github.com/patricklx))
* [#151](https://github.com/ember-native/ember-native/pull/151) update docs support ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2025-05-18)

* ember-native 2.1.1 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#124](https://github.com/ember-native/ember-native/pull/124) add missing components ([@patricklx](https://github.com/patricklx))

#### :house: Internal
* [#126](https://github.com/ember-native/ember-native/pull/126) no alias ([@patricklx](https://github.com/patricklx))
* [#125](https://github.com/ember-native/ember-native/pull/125) migrate to @universal ember/docs support ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2025-05-12)

* ember-native 2.1.0 (minor)

#### :rocket: Enhancement
* `ember-native`
  * [#100](https://github.com/ember-native/ember-native/pull/100) sync with ember each rehydrate ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2025-05-09)

* ember-native 2.0.0 (major)

#### :boom: Breaking Change
* `ember-native`
  * [#66](https://github.com/ember-native/ember-native/pull/66) enable unit tests ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2024-11-18)

ember-native 1.3.0 (minor)

#### :rocket: Enhancement
* `ember-native`
  * [#18](https://github.com/ember-native/ember-native/pull/18) add hot reload ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2024-11-15)

ember-native 1.2.1 (patch)

#### :bug: Bug Fix
* `ember-native`
  * [#17](https://github.com/ember-native/ember-native/pull/17) fix back transition ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2024-11-15)

ember-native 1.2.0 (minor)

#### :rocket: Enhancement
* `docs-app`, `ember-native`
  * [#15](https://github.com/ember-native/ember-native/pull/15) support back transition ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2024-11-14)

ember-native 1.1.0 (minor)

#### :rocket: Enhancement
* `docs-app`, `ember-native`
  * [#8](https://github.com/ember-native/ember-native/pull/8) fill HTMLElementTagNameMap ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))

## Release (2024-11-14)

ember-native 1.0.0 (major)

#### :boom: Breaking Change
* `ember-native`
  * [#5](https://github.com/ember-native/ember-native/pull/5) create-release-1 ([@patricklx](https://github.com/patricklx))

#### Committers: 1
- Patrick Pircher ([@patricklx](https://github.com/patricklx))
