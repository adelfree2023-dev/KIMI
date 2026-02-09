import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@apex/config': path.resolve(
        __dirname,
        '../../packages/config/src/index.ts'
      ),
      '@apex/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      '@apex/audit': path.resolve(
        __dirname,
        '../../packages/audit/src/index.ts'
      ),
      '@apex/middleware': path.resolve(
        __dirname,
        '../../packages/middleware/src/index.ts'
      ),
      '@apex/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
      '@apex/events': path.resolve(
        __dirname,
        '../../packages/events/src/index.ts'
      ),
      '@apex/provisioning': path.resolve(
        __dirname,
        '../../packages/provisioning/src/index.ts'
      ),
      '@apex/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/dto/**',
        '**/node_modules/**',
      ],
      // Phase 1: Reduced thresholds - will increase to 80% later
      thresholds: {
        branches: 30,
        functions: 30,
        lines: 30,
        statements: 30,
      },
    },
    server: {
      deps: {
        inline: [/@apex\/.*/],
      },
    },
  },
});
