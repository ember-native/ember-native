#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "::error::$1"
  exit 1
}

adb uninstall "org.nativescript.embernativedemo" || echo "pass"
adb install demo-app/release.apk
adb logcat -c
adb shell monkey -p org.nativescript.embernativedemo -c android.intent.category.LAUNCHER 1

pid=""
for _ in $(seq 1 30); do
  pid=$(adb shell pidof org.nativescript.embernativedemo | tr -d '\r' || true)
  [ -n "$pid" ] && break
  sleep 2
done
if [ -z "$pid" ]; then
  adb logcat -d
  fail "Release app never started"
fi

sleep 5
if [ -z "$(adb shell pidof org.nativescript.embernativedemo | tr -d '\r' || true)" ]; then
  # Unfiltered: NativeScript logs the underlying JS error (e.g. under the
  # "JS" tag) at Info/Debug level, below what a '*:E' filter would show -
  # only the generic wrapping "Module evaluation promise rejected" survives
  # an error-only filter.
  adb logcat -d
  fail "Release app started then died"
fi

if adb logcat -d | grep -q "FATAL EXCEPTION"; then
  adb logcat -d | grep -A 30 "FATAL EXCEPTION"
  fail "Release app crashed on launch"
fi

echo "Release app started successfully"

# Process survival alone doesn't catch a real, previously-shipped-silently
# class of bug: the app boots, JS evaluation completes, routing fires, and
# the ActionBar title even renders - but the actual route content underneath
# it silently never does (Glimmer no-ops rendering a component whose scope
# binding never resolved, with zero JS/native error). The ActionBar title is
# not a reliable content signal by itself - it rendered in the exact build
# that had this bug - so assert on the index route's real body content
# ("List View", one of its four nav buttons) instead.
content=""
for _ in $(seq 1 10); do
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1 || true
  content=$(adb exec-out cat /sdcard/window_dump.xml 2>/dev/null || true)
  echo "$content" | grep -q 'text="List View"' && break
  sleep 2
done
if ! echo "$content" | grep -q 'text="List View"'; then
  adb logcat -d
  echo "$content"
  fail "Release app booted but the index route's real content ('List View') never rendered - UI hierarchy dump above"
fi

echo "Release app rendered real content successfully"
