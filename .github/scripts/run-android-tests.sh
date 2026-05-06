#!/bin/bash
set -e

# Run tests with 15 minute timeout
timeout 900 bash -c 'cd demo-app && npx -y nativescript test android --emulator' || TEST_EXIT_CODE=$?

# If test failed or timed out, gather diagnostics
if [ "${TEST_EXIT_CODE:-0}" -ne 0 ]; then
  echo "::group::Test failed with exit code ${TEST_EXIT_CODE}. Gathering diagnostics..."
  
  echo "=== ADB Devices ==="
  adb devices -l
  
  echo "=== Logcat (last 500 lines) ==="
  adb logcat -d -t 500
  
  echo "=== App-specific logs ==="
  adb logcat -d -t 500 | grep -i "embernativedemo\|nativescript\|crash\|error\|exception" || echo "No app-specific logs found"
  
  echo "=== Package info ==="
  adb shell pm list packages | grep embernativedemo || echo "Package not found"
  adb shell dumpsys package org.nativescript.embernativedemo || echo "Package dump failed"
  
  echo "=== System info ==="
  adb shell getprop ro.build.version.release
  adb shell getprop ro.build.version.sdk
  
  echo "::endgroup::"
  exit ${TEST_EXIT_CODE}
fi
