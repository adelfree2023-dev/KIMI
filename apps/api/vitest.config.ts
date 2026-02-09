import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@apex/config': resolve(__dirname, '../../packages/config/src/index.ts'),
      '@apex/db': resolve(__dirname, '../../packages/db/src/index.ts'),
      '@apex/audit': resolve(__dirname, '../../packages/audit/src/index.ts'),
      '@apex/middleware': resolve(
        __dirname,
        '../../packages/middleware/src/index.ts'
      ),
      '@apex/auth': resolve(__dirname, '../../packages/auth/src/index.ts'),
      '@apex/events': resolve(__dirname, '../../packages/events/src/index.ts'),
      '@apex/provisioning': resolve(
        __dirname,
        '../../packages/provisioning/src/index.ts'
      ),
      '@apex/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [resolve(__dirname, '../../vitest.setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'dist/**', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
