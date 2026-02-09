/**
 * Storage Manager Tests
 * Verifies MinIO bucket provisioning with quotas and policies
 * Coverage Target: 95%+
 */

import * as Minio from 'minio';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createStorageBucket,
  deleteObject,
  deleteStorageBucket,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  getStorageStats,
  resetMinioClient,
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

const { mockEnv } = vi.hoisted(() => {
  return {
    mockEnv: {
      MINIO_ENDPOINT: 'localhost',
      MINIO_PORT: '9000',
      MINIO_USE_SSL: 'false',
      MINIO_ACCESS_KEY: 'test',
      MINIO_SECRET_KEY: 'test',
      MINIO_REGION: 'us-east-1',
    },
  };
});

vi.mock('@apex/config', () => ({
  env: mockEnv,
}));

// ...

describe('Storage Manager', () => {
  let mockClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Force recreate/capture of mock client
    mockClient = new Minio.Client({} as any);
    // Overwrite the singleton instance with our new mock for this test
    (Minio.Client as any).mockImplementation(() => mockClient);

    // Reset the internal singleton to force re-init with our mock
    resetMinioClient();

    expect(Minio.Client).toHaveBeenCalled();

    // Trigger lazy init (ignore errors if it already exists or fails during init)
    try {
      await createStorageBucket('init');
    } catch (_e) {
      // Ignore init errors in beforeEach
    }
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

      // Test Invalid plan (fallback to free 1GB)
      const invalidResult = await createStorageBucket(
        'uuid-3',
        'invalid' as any
      );
      expect(invalidResult.quotaBytes).toBe(1024 * 1024 * 1024);
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
        toArray: async () => [],
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
        toArray: async () => [{ name: 'file.txt', size: 100 }],
      });

      await expect(deleteStorageBucket('uuid-123')).rejects.toThrow(
        'not empty'
      );
    });

    it('should delete non-empty bucket with force=true', async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [{ name: 'file.txt', size: 100 }],
      });
      mockClient.removeBucket.mockResolvedValue(undefined);

      // Note: Actual implementation would need to delete objects first
      // This tests the interface contract
      const result = await deleteStorageBucket('uuid-123', true);
      expect(result).toBe(true);
    });

    it('should handle generic errors in deleteStorageBucket', async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [],
      });
      mockClient.removeBucket.mockRejectedValue(new Error('Random Fail'));

      const result = await deleteStorageBucket('uuid-123');
      expect(result).toBe(false);
    });

    it('should handle non-Error objects in deleteStorageBucket catch block', async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [],
      });
      mockClient.removeBucket.mockRejectedValue('String Error');

      const result = await deleteStorageBucket('uuid-123');
      expect(result).toBe(false);
    });
  });

  describe('getStorageStats', () => {
    it('should calculate total usage from all objects', async () => {
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [
          { name: 'file1.jpg', size: 1024, lastModified: new Date() },
          { name: 'file2.jpg', size: 2048, lastModified: new Date() },
          { name: 'file3.jpg', size: 4096, lastModified: new Date() },
        ],
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
        toArray: async () => [],
      });
      mockClient.getBucketTagging.mockResolvedValue({ plan: 'free' });

      const result = await getStorageStats('uuid-123');

      expect(result.usedBytes).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.totalObjects).toBe(0);
      expect(result.usagePercent).toBe(0);
    });

    it('should fallback to default quota if getBucketTagging fails', async () => {
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [],
      });
      mockClient.getBucketTagging.mockRejectedValue(new Error('Tags Fail'));

      const result = await getStorageStats('uuid-123');
      expect(result.quotaBytes).toBe(1024 * 1024 * 1024); // DEFAULT (free)
    });

    it('should handle objects with missing lastModified in getStorageStats', async () => {
      mockClient.listObjects.mockReturnValue({
        toArray: async () => [
          { name: 'file1.jpg', size: 1024 }, // No lastModified
        ],
      });
      mockClient.getBucketTagging.mockResolvedValue([
        { Key: 'plan', Value: 'pro' },
      ]);

      const result = await getStorageStats('uuid-123');
      expect(result.lastModified).toBeInstanceOf(Date);
      expect(result.quotaBytes).toBe(100 * 1024 * 1024 * 1024);
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

  describe('getSignedDownloadUrl', () => {
    it('should generate presigned URL for download', async () => {
      mockClient.presignedGetObject.mockResolvedValue(
        'https://example.com/download'
      );
      const url = await getSignedDownloadUrl('uuid-123', 'file.txt');
      expect(url).toBe('https://example.com/download');
      expect(mockClient.presignedGetObject).toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      mockClient.presignedGetObject.mockRejectedValue(new Error('fail'));
      await expect(
        getSignedDownloadUrl('uuid-123', 'file.txt')
      ).rejects.toThrow('Failed to generate download URL');
    });
  });

  describe('deleteObject', () => {
    it('should return true on success', async () => {
      mockClient.removeObject.mockResolvedValue(undefined);
      const result = await deleteObject('uuid-123', 'file.txt');
      expect(result).toBe(true);
      expect(mockClient.removeObject).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      mockClient.removeObject.mockRejectedValue(new Error('fail'));
      const result = await deleteObject('uuid-123', 'file.txt');
      expect(result).toBe(false);
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

    it('should throw "Failed to generate upload URL" on presignedPutObject error', async () => {
      mockClient.presignedPutObject.mockRejectedValue(new Error('fail'));
      await expect(getSignedUploadUrl('uuid-123', 'file.txt')).rejects.toThrow(
        'Failed to generate upload URL'
      );
    });
  });
  describe('Configuration Edge Cases', () => {
    const manualMock = {
      bucketExists: vi.fn().mockResolvedValue(false),
      makeBucket: vi.fn().mockResolvedValue(undefined),
      setBucketVersioning: vi.fn().mockResolvedValue(undefined),
      setBucketPolicy: vi.fn().mockResolvedValue(undefined),
      setBucketTagging: vi.fn().mockResolvedValue(undefined),
      putObject: vi.fn().mockResolvedValue(undefined),
      listObjects: vi.fn().mockReturnValue({ toArray: async () => [] }),
    };

    it('should use HTTPS endpoint when MINIO_USE_SSL is true', async () => {
      mockEnv.MINIO_USE_SSL = 'true';

      const result = await createStorageBucket(
        'ssl-test',
        'free',
        manualMock as any
      );

      expect(result.endpoint).toContain('https://');
      mockEnv.MINIO_USE_SSL = 'false'; // Reset
    });

    it('should default to us-east-1 when MINIO_REGION is missing', async () => {
      mockEnv.MINIO_REGION = '';

      await createStorageBucket('region-test', 'free', manualMock as any);

      expect(manualMock.makeBucket).toHaveBeenCalledWith(
        expect.any(String),
        'us-east-1'
      );
      mockEnv.MINIO_REGION = 'us-east-1'; // Reset
    });
  });

  describe('Non-Error Exception Handling', () => {
    it('should handle non-Error objects in createStorageBucket', async () => {
      mockClient.bucketExists.mockRejectedValue('String Error');
      await expect(createStorageBucket('fail')).rejects.toThrow(
        'Unknown error'
      );
    });

    it('should handle non-Error objects in getStorageStats', async () => {
      mockClient.listObjects.mockImplementation(() => {
        throw 'String Error';
      });
      await expect(getStorageStats('fail')).rejects.toThrow('Unknown error');
    });
  });
});
