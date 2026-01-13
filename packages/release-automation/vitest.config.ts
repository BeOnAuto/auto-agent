import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    include: ['src/**/*.specs.ts'],
    exclude: ['integration-tests/**/*.specs.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.specs.ts', 'src/**/index.ts', 'src/types/**/*.ts', 'src/testing/**/*.ts', 'bin/**/*.ts'],
    },
  },
});
