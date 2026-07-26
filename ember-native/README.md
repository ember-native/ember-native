ember-native
==============================================================================

use the Ember framework with Nativescript 


`ember-native-nativescript` binary
------------------------------------------------------------------------------

This package installs a `ember-native-nativescript` binary alongside the
`nativescript` CLI it depends on. It's a thin wrapper: it forwards all
arguments unchanged to `nativescript`/`tns`, but also works around a real bug
in `nativescript`'s CLI (confirmed still present as of `nativescript@9.0.6`,
the latest stable release at the time of writing - see
[`NativeScript/nativescript-cli`](https://github.com/NativeScript/nativescript-cli)):
`nativescript build`/`nativescript test` never copy `@nativescript/vite`'s
build output into the native platform project, silently producing an empty
or stale native app. Only `nativescript debug`'s watch-mode path happens to
copy it correctly. No tracking issue could be found upstream for this bug at
the time of writing.

If your app uses `@nativescript/vite`, point your `package.json` scripts at
`ember-native-nativescript` instead of `nativescript`/`tns` directly - it
otherwise behaves identically, and becomes a no-op the moment upstream ships
a real fix (detected automatically, not hardcoded to a version). For example:

```json
{
  "scripts": {
    "run": "ember-native-nativescript debug android",
    "test": "ember-native-nativescript test android --no-watch",
    "build": "ember-native-nativescript build android",
    "debug": "ember-native-nativescript debug android --debug-brk",
    "prepare-android": "ember-native-nativescript prepare android"
  }
}
```

`ember-native-nativescript` resolves `nativescript` the same way `nativescript`
itself would: from the current working directory. Run it from your app's
project root (the directory that depends on `nativescript`), the same place
you'd run `nativescript` from - not from wherever `ember-native` happens to be
installed. This also means it won't work as expected if invoked through a task
runner that changes `cwd` (e.g. Nx or Turborepo's `--cwd`) to somewhere without
`nativescript` in scope.


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
