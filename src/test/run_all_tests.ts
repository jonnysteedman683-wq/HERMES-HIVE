import { execSync } from 'child_process';

console.log('=====================================================');
console.log('   HERMES HIVE — COMPREHENSIVE SUITE VERIFICATION    ');
console.log('=====================================================\n');

const testFiles = [
  'src/test/stage8.test.ts',
  'src/test/stage8_5.test.ts',
  'src/test/stage9_chat.test.ts',
  'src/test/stage9_evolution.test.ts',
];

for (const file of testFiles) {
  console.log(`\nExecuting ${file}...`);
  try {
    const out = execSync(`npx tsx ${file}`, { encoding: 'utf-8' });
    console.log(out);
  } catch (err: any) {
    console.error(`Failed ${file}:`, err.stdout || err.message);
    process.exit(1);
  }
}

console.log('\n=====================================================');
console.log('   ALL TEST SUITES EXECUTED AND PASSED CLEANLY!       ');
console.log('=====================================================\n');
