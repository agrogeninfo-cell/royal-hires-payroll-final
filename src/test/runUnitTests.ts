import { SystemTestSuite } from './unitTests';

const results = SystemTestSuite.runAllTests();
const passed = results.filter((result) => result.passed).length;
const failed = results.filter((result) => !result.passed);

for (const result of results) {
  const status = result.passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] #${result.id} ${result.title}: ${result.message}`);
}

console.log(`\nUnit verification summary: ${passed}/${results.length} passed; ${failed.length} failed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
