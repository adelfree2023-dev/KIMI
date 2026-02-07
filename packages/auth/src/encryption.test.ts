import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, hashApiKey, generateApiKey, maskSensitive } from './encryption.js';

describe('Encryption Service', () => {
  const testMasterKey = 'test-secret-key-32-chars-longgggg';

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive data';
      const encrypted = encrypt(plaintext, testMasterKey);
      
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted).toHaveProperty('salt');
      
      const decrypted = decrypt(encrypted, testMasterKey);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted output for same plaintext', () => {
      const plaintext = 'test';
      const encrypted1 = encrypt(plaintext, testMasterKey);
      const encrypted2 = encrypt(plaintext, testMasterKey);
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('API Key management', () => {
    it('should generate unique API keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      
      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^apex_/);
      expect(key2).toMatch(/^apex_/);
    });

    it('should hash API keys consistently', () => {
      const key = 'test-key';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(key);
    });
  });

  describe('maskSensitive', () => {
    it('should mask sensitive data correctly', () => {
      const masked = maskSensitive('1234567890', 2);
      expect(masked).toBe('12******90');
    });

    it('should mask all for short strings', () => {
      const masked = maskSensitive('abcd', 2);
      expect(masked).toBe('****');
    });
  });
});
