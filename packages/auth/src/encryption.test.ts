
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EncryptionService,
  encrypt,
  decrypt,
  hashApiKey,
  generateApiKey,
  maskSensitive
} from './encryption.js';

describe('Encryption Utilities', () => {
  const masterKey = 'test-key-must-be-32-bytes-long!!';

  it('should encrypt and decrypt correctly', () => {
    const plaintext = 'sensitive-data';
    const encrypted = encrypt(plaintext, masterKey);

    expect(encrypted).toHaveProperty('encrypted');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('tag');
    expect(encrypted).toHaveProperty('salt');

    const decrypted = decrypt(encrypted, masterKey);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different outputs for same input due to salt/iv', () => {
    const plaintext = 'sensitive-data';
    const enc1 = encrypt(plaintext, masterKey);
    const enc2 = encrypt(plaintext, masterKey);

    expect(enc1.encrypted).not.toBe(enc2.encrypted);
    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.salt).not.toBe(enc2.salt);
  });

  it('should hash api key consistently', () => {
    const apiKey = 'apex_12345';
    const hash1 = hashApiKey(apiKey);
    const hash2 = hashApiKey(apiKey);
    expect(hash1).toBe(hash2);
  });

  it('should generate secure api key', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^apex_/);
    expect(key.length).toBeGreaterThan(30);
  });

  it('should mask sensitive data', () => {
    expect(maskSensitive('1234567890', 2)).toBe('12******90');
    expect(maskSensitive('short', 4)).toBe('*****');
  });
});

describe('EncryptionService', () => {
  let service: EncryptionService;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should initialize with provided master key', () => {
    process.env.ENCRYPTION_MASTER_KEY = 'ValidProdPass32CharsWith1$!Abc12'; // Added 2 chars to reach 32
    process.env.NODE_ENV = 'production'; // Enforce strict checks but with valid key

    service = new EncryptionService();
    expect(service).toBeDefined();
  });

  it('should use default test key in test environment if missing', () => {
    delete process.env.ENCRYPTION_MASTER_KEY;
    process.env.NODE_ENV = 'test';

    service = new EncryptionService();
    expect(service).toBeDefined();
    // Verify it works
    const enc = service.encrypt('test');
    expect(service.decrypt(enc)).toBe('test');
  });

  it('should throw in production if key is missing', () => {
    delete process.env.ENCRYPTION_MASTER_KEY;
    process.env.NODE_ENV = 'production';

    expect(() => new EncryptionService()).toThrow('S1 Violation: ENCRYPTION_MASTER_KEY is required');
  });

  it('should throw if key is too short', () => {
    process.env.ENCRYPTION_MASTER_KEY = 'short';
    expect(() => new EncryptionService()).toThrow('S1 Violation');
  });

  it('should throw in production if key contains forbidden patterns', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_MASTER_KEY = 'test-encryption-key-32-chars-long!'; // contains 'test'
    expect(() => new EncryptionService()).toThrow('forbidden pattern');
  });

  process.env.ENCRYPTION_MASTER_KEY = 'MasterPassWithoutSpecialCharsLongEnough';
  expect(() => new EncryptionService()).toThrow('must contain');
});

it('should throw in production if key has low entropy', () => {
  process.env.NODE_ENV = 'production';
  // This key is long enough and has complexity but repeated characters (low entropy)
  process.env.ENCRYPTION_MASTER_KEY = 'AAAAaaaa1111!!!!AAAAaaaa1111!!!!';
  expect(() => new EncryptionService()).toThrow('insufficient entropy');
});

it('should delegate methods to utility functions', () => {
  process.env.ENCRYPTION_MASTER_KEY = 'Test-Encryption-Key-32-Chars-Long!1';
  process.env.NODE_ENV = 'test';
  service = new EncryptionService();

  const enc = service.encrypt('data');
  expect(enc).toHaveProperty('encrypted');
  expect(service.decrypt(enc)).toBe('data');
  expect(service.hashApiKey('key')).toBeDefined();
  expect(service.generateApiKey()).toMatch(/^apex_/);
  expect(service.mask('1234567890', 2)).toBe('12******90');
});
});
