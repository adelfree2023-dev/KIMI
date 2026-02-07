import { defineConfig } from 'vitest/config';

/**
 * Root Vitest Configuration
 * Enforces Constitution Rule 4.1: Test Coverage Mandate
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      all: true, // Force check all files, even untested ones
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/dto/**',
        '**/types.ts',
        '**/index.ts', // Barrel files
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Constitution Rule 4.1: Coverage Thresholds
      thresholds: {
        // Global minimum: 50%
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
    // Fail on untested files
    onConsoleLog: (log, type) => {
      if (type === 'error') {
        // eslint-disable-next-line no-console
        console.error(log);
      }
    },
  },
});
