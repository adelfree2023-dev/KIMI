import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@apex/audit': path.resolve(
        __dirname,
        '../../packages/audit/src/index.ts'
      ),
      '@apex/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      '@apex/provisioning': path.resolve(
        __dirname,
        '../../packages/provisioning/src/index.ts'
      ),
      '@apex/middleware': path.resolve(
        __dirname,
        '../../packages/middleware/src/index.ts'
      ),
      '@apex/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
      '@apex/config': path.resolve(
        __dirname,
        '../../packages/config/src/index.ts'
      ),
    },
    coverage: {
      provider: 'v8',
      all: true, // Check ALL files, not just tested ones
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/dto/**', '**/node_modules/**'],
      // Constitution Rule 4.1: Minimum coverage thresholds
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
        // Critical modules must have 100% coverage
        'src/provisioning/**': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        'src/auth/**': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
    // Ensure workspace packages are transformed
    server: {
      deps: {
        inline: [/@apex\/.*/],
      },
    },
  },
});
