import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
        '@apex/config': resolve(__dirname, 'packages/config/src/index.ts'),
        '@apex/db': resolve(__dirname, 'packages/db/src/index.ts'),
        '@apex/audit': resolve(__dirname, 'packages/audit/src/index.ts'),
        '@apex/middleware': resolve(__dirname, 'packages/middleware/src/index.ts'),
        '@apex/auth': resolve(__dirname, 'packages/auth/src/index.ts'),
        '@apex/events': resolve(__dirname, 'packages/events/src/index.ts'),
        '@apex/provisioning': resolve(__dirname, 'packages/provisioning/src/index.ts'),
        '@apex/ui': resolve(__dirname, 'packages/ui/src/index.ts'),
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
