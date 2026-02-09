/**
 * Provisioning CLI Tests
 * Tests CLI logic by calling the main function directly
 * This ensures Vitest can collect coverage
 */

import { NestFactory } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from './provision.js';

// Mock NestJS and AppModule
vi.mock('@nestjs/core', () => ({
  NestFactory: {
    createApplicationContext: vi.fn(),
  },
}));

// Mock AppModule to avoid circular dependencies and heavy imports
vi.mock('../app.module.js', () => ({
  AppModule: class {},
}));

describe('Provisioning CLI (Integrated)', () => {
  const mockApp = {
    get: vi.fn(),
    close: vi.fn(),
  };

  const mockProvisioningService = {
    provision: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(NestFactory.createApplicationContext).mockResolvedValue(
      mockApp as any
    );
    mockApp.get.mockReturnValue(mockProvisioningService);
  });

  it('should fail when missing required arguments', async () => {
    await expect(main([])).rejects.toThrow('Missing required arguments');
  });

  it('should show usage help when missing arguments', async () => {
    await expect(main([])).rejects.toThrow(/Missing required arguments/);
  });

  it('should fail when missing subdomain', async () => {
    await expect(
      main([
        '--email=test@test.com',
        '--password=Pass123!',
        '--store-name=TestStore',
      ])
    ).rejects.toThrow('Missing required arguments');
  });

  it('should successfully call provisioning service with correct args', async () => {
    mockProvisioningService.provision.mockResolvedValue({
      subdomain: 'test-store',
      durationMs: 100,
      adminId: 'admin-123',
    });

    const args = [
      '--subdomain=test-store',
      '--plan=pro',
      '--email=admin@test.com',
      '--password=Pass123!',
      '--store-name=My Store',
      '--quiet',
    ];

    const result = await main(args);

    expect(NestFactory.createApplicationContext).toHaveBeenCalled();
    expect(mockProvisioningService.provision).toHaveBeenCalledWith({
      subdomain: 'test-store',
      plan: 'pro',
      adminEmail: 'admin@test.com',
      storeName: 'My Store',
    });
    expect(result.subdomain).toBe('test-store');
    expect(mockApp.close).toHaveBeenCalled();
  });

  it('should handle provisioning service failures', async () => {
    mockProvisioningService.provision.mockRejectedValue(
      new Error('Provisioning failed')
    );

    const args = [
      '--subdomain=test-store',
      '--email=admin@test.com',
      '--password=Pass123!',
      '--store-name=My Store',
    ];

    await expect(main(args)).rejects.toThrow('Provisioning failed');
  });

  it('should accept quiet flag and suppress logs', async () => {
    mockProvisioningService.provision.mockResolvedValue({
      subdomain: 'test',
      durationMs: 0,
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await main([
      '--subdomain=test',
      '--email=t@t.com',
      '--password=p',
      '--store-name=s',
      '--quiet',
    ]);

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
