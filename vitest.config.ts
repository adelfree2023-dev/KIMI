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
        // Global minimum: 80%
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
        // Critical modules: 100% (Auto-Reject if not met)
        'packages/provisioning/src/**/*.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        'packages/auth/src/**/*.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        'packages/middleware/src/**/*.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        // Core business logic
        'packages/db/src/schema.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
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
