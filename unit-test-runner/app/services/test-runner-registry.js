let runTests;

export function registerTestRunner(testRunner) {
  runTests = testRunner;
}

export async function executeRegisteredTests() {
  await runTests?.();
}
