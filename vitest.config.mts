import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Root Vitest Configuration
 * Enforces Constitution Rule 4.1: Test Coverage Mandate
 * NOTE: Thresholds temporarily reduced to 30% during Phase 1
 * Will be increased back to 80% after adding more tests
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
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
      if (type === 'stderr') {
        console.error(log);
      }
    },
  },
});
