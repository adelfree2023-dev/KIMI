import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        alias: {
            '@apex/audit': path.resolve(__dirname, '../../packages/audit/src/index.ts'),
            '@apex/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
            '@apex/provisioning': path.resolve(__dirname, '../../packages/provisioning/src/index.ts'),
            '@apex/middleware': path.resolve(__dirname, '../../packages/middleware/src/index.ts'),
            '@apex/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
            '@apex/config': path.resolve(__dirname, '../../packages/config/src/index.ts'),
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['**/*.spec.ts', '**/*.test.ts'],
        },
    },
});
