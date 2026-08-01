import { Application } from '@nativescript/core';

export function killProcess() {
  if (android.os.Build.VERSION.SDK_INT >= 21) {
    Application.android.startActivity?.finishAndRemoveTask();
  } else {
    Application.android.startActivity?.finishAffinity();
  }
  java.lang.System.exit(0);
}
