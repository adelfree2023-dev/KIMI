/**
 * Vitest Global Setup
 * satisfy S1 Environmental Validation Protocol (Rule S1)
 */

process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-chars-long';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_ACCESS_KEY = 'minio-access-key';
process.env.MINIO_SECRET_KEY = 'minio-secret-key';
process.env.NODE_ENV = 'test';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ENABLE_S1_ENFORCEMENT = 'false';
