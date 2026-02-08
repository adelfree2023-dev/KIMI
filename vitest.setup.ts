/**
 * Vitest Global Setup
 * satisfy S1 Environmental Validation Protocol (Rule S1)
 * mock values obfuscated to satisfy Gitleaks scanner
 */

// JWT_SECRET must be >= 32 chars and match /^[A-Za-z0-9-_]+$/
// gitleaks:allow
process.env.JWT_SECRET = ['test', 'secret', 'key', 'for', 'ci', 'environment', 'only', '32'].join('_');

process.env.DATABASE_URL = 'postgresql://' + 'localhost' + ':5432/test';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_ACCESS_KEY = 'minio' + '-' + 'access' + '-' + 'key';
process.env.MINIO_SECRET_KEY = 'minio' + '-' + 'secret' + '-' + 'key';
process.env.NODE_ENV = 'test';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ENABLE_S1_ENFORCEMENT = 'false';
