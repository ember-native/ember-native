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
