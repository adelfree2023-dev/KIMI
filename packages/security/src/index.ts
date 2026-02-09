/**
 * @apex/security - Advanced Security Modules
 * 
 * P1 Security Enhancements:
 * - mTLS (Mutual TLS) for inter-service communication
 * - Secrets Rotation with zero-downtime
 * - Penetration testing utilities
 */

// mTLS Module
export {
  MTLSServer,
  loadCertificates,
  createMTLSServerOptions,
  createMTLSClientConfig,
  getCertificatePaths,
  mtlsMiddleware,
  type MTLSConfig,
  type MTLSClientConfig,
} from './mtls/index.js';

// Secrets Module
export {
  SecretsManager,
  secretsManager,
  VaultIntegration,
  generateSecret,
  hashSecret,
  verifySecret,
  type SecretConfig,
  type SecretRotationEvent,
  type RotationListener,
} from './secrets/index.js';

// Encryption Module (S7)
export {
  EncryptionService,
  encrypt,
  decrypt,
  hashApiKey,
  generateApiKey,
  maskSensitive,
  type EncryptedData,
} from './encryption.js';
