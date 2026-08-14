#!/usr/bin/env bash
set -euo pipefail

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
  echo "Release app never started"
  adb logcat -d '*:E'
  exit 1
fi

sleep 5
if [ -z "$(adb shell pidof org.nativescript.embernativedemo | tr -d '\r' || true)" ]; then
  echo "Release app started then died"
  adb logcat -d '*:E'
  exit 1
fi

if adb logcat -d | grep -q "FATAL EXCEPTION"; then
  echo "Release app crashed on launch"
  adb logcat -d | grep -A 30 "FATAL EXCEPTION"
  exit 1
fi

echo "Release app started successfully"
