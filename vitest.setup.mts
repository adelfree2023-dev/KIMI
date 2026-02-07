import 'reflect-metadata';
import { vi } from 'vitest';

// Global mocks if needed
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test_secret_key_for_ci_environment_only_32');
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
