import { describe, it, expect } from 'vitest';
import { ProvisioningController, ProvisioningService, ProvisioningModule } from './index.js';

describe('Provisioning Index Exports', () => {
  it('should export ProvisioningController', () => {
    expect(ProvisioningController).toBeDefined();
  });

  it('should export ProvisioningService', () => {
    expect(ProvisioningService).toBeDefined();
  });

  it('should export ProvisioningModule', () => {
    expect(ProvisioningModule).toBeDefined();
  });
});
