import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only the real vitest suites collect. The stage*/hermesWebIntegration
    // files are standalone self-validating scenario scripts (own assert +
    // process.exit), not vitest suites — running them through vitest yields
    // "No test suite found" per file. See issue #2 for converting them.
    include: ['src/test/**/*.test.ts'],
    exclude: [
      'src/test/stage6.test.ts',
      'src/test/stage7.test.ts',
      'src/test/stage8.test.ts',
      'src/test/stage8_5.test.ts',
      'src/test/stage9.test.ts',
      'src/test/stage9_chat.test.ts',
      'src/test/stage9_evolution.test.ts',
      'src/test/hermesWebIntegration.test.ts',
    ],
  },
});
