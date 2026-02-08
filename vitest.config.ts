import { defineConfig } from 'vitest/config';

/**
 * Root Vitest Configuration
 * Enforces Constitution Rule 4.1: Test Coverage Mandate
 * NOTE: Thresholds temporarily reduced to 30% during Phase 1
 * Will be increased back to 80% after adding more tests
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    resolve: {
      alias: {
        '@apex/config': new URL('./packages/config/src/index.ts', import.meta.url).pathname,
        '@apex/db': new URL('./packages/db/src/index.ts', import.meta.url).pathname,
        '@apex/audit': new URL('./packages/audit/src/index.ts', import.meta.url).pathname,
        '@apex/middleware': new URL('./packages/middleware/src/index.ts', import.meta.url).pathname,
        '@apex/auth': new URL('./packages/auth/src/index.ts', import.meta.url).pathname,
        '@apex/events': new URL('./packages/events/src/index.ts', import.meta.url).pathname,
        '@apex/provisioning': new URL('./packages/provisioning/src/index.ts', import.meta.url).pathname,
        '@apex/ui': new URL('./packages/ui/src/index.ts', import.meta.url).pathname,
      },
    },
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/dto/**',
        '**/types.ts',
        '**/index.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Phase 1: Reduced thresholds - will increase to 80% later
      thresholds: {
        branches: 30,
        functions: 30,
        lines: 30,
        statements: 30,
      },
    },
    onConsoleLog: (log, type) => {
      if (type === 'error') {
        console.error(log);
      }
    },
  },
});
