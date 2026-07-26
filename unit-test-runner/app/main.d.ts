export interface RunTestAppOptions {
  runTests?: () => unknown;
}

export function runTestApp(options?: RunTestAppOptions): void;
