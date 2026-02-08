/**
 * Storage Manager Tests
 * Verifies MinIO bucket provisioning with quotas and policies
 * Coverage Target: 95%+
 */

import * as Minio from 'minio';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createStorageBucket,
  deleteStorageBucket,
  getSignedUploadUrl,
  getStorageStats,
  minioClient,
} from './storage-manager.js';

// Mock MinIO client
vi.mock('minio', () => ({
  Client: vi.fn().mockImplementation(() => ({
    bucketExists: vi.fn(),
    makeBucket: vi.fn(),
    removeBucket: vi.fn(),
    setBucketVersioning: vi.fn(),
    setBucketPolicy: vi.fn(),
    setBucketTagging: vi.fn(),
    putObject: vi.fn(),
    listObjects: vi.fn(),
    presignedPutObject: vi.fn(),
    getBucketTagging: vi.fn(),
    presignedGetObject: vi.fn(),
    removeObject: vi.fn(),
  })),
}));

vi.mock('@apex/config', () => ({
  env: {
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: '9000',
    MINIO_USE_SSL: 'false',
    MINIO_ACCESS_KEY: 'test',
    MINIO_SECRET_KEY: 'test',
    MINIO_REGION: 'us-east-1',
  },
}));

describe('Storage Manager', () => {
  let mockClient: any;

  beforeEach(() => {
    // Force initialization of minioClient if it's null
    if (!minioClient) {
      try {
        // This will call new Minio.Client() which is mocked
        import('./storage-manager.js').then(m => m.getSignedUploadUrl('t', 'o'));
      } catch (e) { }
    }

    // Direct mock for simplicity if minioClient is still not playing nice
    mockClient = minioClient || (Minio.Client as any).mock.results[0]?.value;

    // If still null, create a manual mock capture
    if (!mockClient) {
      mockClient = new Minio.Client({} as any);
    }

    vi.clearAllMocks();
  });

  describe('createStorageBucket', () => {
    it('should create bucket with correct naming convention', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined);
      mockClient.setBucketVersioning.mockResolvedValue(undefined);
      mockClient.setBucketPolicy.mockResolvedValue(undefined);
      mockClient.setBucketTagging.mockResolvedValue(undefined);
      mockClient.putObject.mockResolvedValue(undefined);

      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await createStorageBucket(tenantId, 'basic');

      // Verify naming: tenant-{uuid-without-dashes}-assets
      expect(result.bucketName).toBe(
        'tenant-550e8400e29b41d4a716446655440000-assets'
      );
      expect(mockClient.makeBucket).toHaveBeenCalledWith(
        'tenant-550e8400e29b41d4a716446655440000-assets',
        expect.any(String)
      );
    });

    it('should enable versioning for audit trail', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined);
      mockClient.setBucketVersioning.mockResolvedValue(undefined);
      mockClient.setBucketPolicy.mockResolvedValue(undefined);
      mockClient.setBucketTagging.mockResolvedValue(undefined);
      mockClient.putObject.mockResolvedValue(undefined);

      await createStorageBucket('uuid-123', 'basic');

      expect(mockClient.setBucketVersioning).toHaveBeenCalledWith(
        expect.any(String),
        { Status: 'Enabled' }
      );
    });

    it('should set public read policy for /public/* paths only', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined);
      mockClient.setBucketVersioning.mockResolvedValue(undefined);
      mockClient.setBucketPolicy.mockResolvedValue(undefined);
      mockClient.setBucketTagging.mockResolvedValue(undefined);
      mockClient.putObject.mockResolvedValue(undefined);

      await createStorageBucket('uuid-123', 'basic');

      const policyCall = mockClient.setBucketPolicy.mock.calls[0];
      const policy = JSON.parse(policyCall[1]);

      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Action).toContain('s3:GetObject');
      expect(policy.Statement[0].Resource[0]).toContain('/public/*');
    });

    it('should set correct quota based on plan', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined);
      mockClient.setBucketVersioning.mockResolvedValue(undefined);
      mockClient.setBucketPolicy.mockResolvedValue(undefined);
      mockClient.setBucketTagging.mockResolvedValue(undefined);
      mockClient.putObject.mockResolvedValue(undefined);

      // Test Free plan (1GB)
      const freeResult = await createStorageBucket('uuid-1', 'free');
      expect(freeResult.quotaBytes).toBe(1024 * 1024 * 1024);

      // Test Pro plan (100GB)
      const proResult = await createStorageBucket('uuid-2', 'pro');
      expect(proResult.quotaBytes).toBe(100 * 1024 * 1024 * 1024);
    });

    it('should create folder structure', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined);
      mockClient.setBucketVersioning.mockResolvedValue(undefined);
      mockClient.setBucketPolicy.mockResolvedValue(undefined);
      mockClient.setBucketTagging.mockResolvedValue(undefined);
      mockClient.putObject.mockResolvedValue(undefined);

      await createStorageBucket('uuid-123', 'basic');

      expect(mockClient.putObject).toHaveBeenCalledWith(
        expect.any(String),
        'public/products/.keep',
        expect.any(Buffer)
      );
      expect(mockClient.putObject).toHaveBeenCalledWith(
        expect.any(String),
        'private/exports/.keep',
        expect.any(Buffer)
      );
    });

    it('should throw if bucket already exists', async () => {
      mockClient.bucketExists.mockResolvedValue(true);

      await expect(createStorageBucket('uuid-123')).rejects.toThrow(
        'already exists'
      );
    });

    it('should measure and return duration', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined);
      mockClient.setBucketVersioning.mockResolvedValue(undefined);
      mockClient.setBucketPolicy.mockResolvedValue(undefined);
      mockClient.setBucketTagging.mockResolvedValue(undefined);
      mockClient.putObject.mockResolvedValue(undefined);

      const result = await createStorageBucket('uuid-123', 'basic');

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteStorageBucket', () => {
    it('should return false for non-existent bucket', async () => {
      mockClient.bucketExists.mockResolvedValue(false);

      const result = await deleteStorageBucket('uuid-123');

      expect(result).toBe(false);
    });

    it('should delete empty bucket', async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      mockClient.listObjects.mockReturnValue({
        toArray: async () => []
      });
      mockClient.removeBucket.mockResolvedValue(undefined);

      const result = await deleteStorageBucket('uuid-123');

      expect(result).toBe(true);
      expect(mockClient.removeBucket).toHaveBeenCalledWith(
        'tenant-uuid123-assets'
      );
    });

    it('should throw if bucket not empty and force=false', async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [{ name: 'file.txt', size: 100 }]
      });

      await expect(deleteStorageBucket('uuid-123')).rejects.toThrow(
        'not empty'
      );
    });

    it('should delete non-empty bucket with force=true', async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [{ name: 'file.txt', size: 100 }]
      });
      mockClient.removeBucket.mockResolvedValue(undefined);

      // Note: Actual implementation would need to delete objects first
      // This tests the interface contract
      const result = await deleteStorageBucket('uuid-123', true);
      expect(result).toBe(true);
    });
  });

  describe('getStorageStats', () => {
    it('should calculate total usage from all objects', async () => {
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [
          { name: 'file1.jpg', size: 1024, lastModified: new Date() },
          { name: 'file2.jpg', size: 2048, lastModified: new Date() },
          { name: 'file3.jpg', size: 4096, lastModified: new Date() },
        ]
      });
      mockClient.getBucketTagging.mockResolvedValue({ plan: 'free' });

      const result = await getStorageStats('uuid-123');

      expect(result.usedBytes).toBe(7168); // 1024 + 2048 + 4096
      expect(result.totalSize).toBe(7168);
      expect(result.totalObjects).toBe(3);
      expect(result.quotaBytes).toBeGreaterThan(0);
      expect(result.usagePercent).toBeGreaterThan(0);
    });

    it('should handle empty bucket', async () => {
      mockClient.listObjects.mockReturnValue({
        toArray: async () => []
      });
      mockClient.getBucketTagging.mockResolvedValue({ plan: 'free' });

      const result = await getStorageStats('uuid-123');

      expect(result.usedBytes).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.totalObjects).toBe(0);
      expect(result.usagePercent).toBe(0);
    });
  });

  describe('getSignedUploadUrl', () => {
    it('should generate presigned URL for direct upload', async () => {
      mockClient.presignedPutObject.mockResolvedValue(
        'https://minio.example.com/bucket/object?X-Amz-Algorithm=AWS4-HMAC-SHA256'
      );

      const url = await getSignedUploadUrl(
        'uuid-123',
        'products/image.jpg',
        3600
      );

      expect(url).toContain('X-Amz-Algorithm');
      expect(mockClient.presignedPutObject).toHaveBeenCalledWith(
        'tenant-uuid123-assets',
        'products/image.jpg',
        3600
      );
    });

    it('should use default expiry of 1 hour', async () => {
      mockClient.presignedPutObject.mockResolvedValue(
        'https://example.com/upload'
      );

      await getSignedUploadUrl('uuid-123', 'file.txt');

      expect(mockClient.presignedPutObject).toHaveBeenCalledWith(
        expect.any(String),
        'file.txt',
        3600
      );
    });
  });

  describe('Error Handling', () => {
    it('should wrap MinIO errors with context', async () => {
      mockClient.bucketExists.mockRejectedValue(
        new Error('Connection refused')
      );

      await expect(createStorageBucket('uuid-123')).rejects.toThrow(
        'Failed to create storage bucket: Connection refused'
      );
    });

    it('should handle permission denied errors', async () => {
      mockClient.listObjects.mockImplementation(() => {
        throw new Error('Access Denied');
      });

      await expect(getStorageStats('uuid-123')).rejects.toThrow(
        'Access Denied'
      );
    });
  });
});
