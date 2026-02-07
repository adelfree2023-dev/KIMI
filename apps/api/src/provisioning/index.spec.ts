import { describe, it, expect } from 'vitest';
import * as provisioning from './index.js';

describe('Provisioning Index Exports', () => {
  it('should export ProvisioningController', () => {
    expect(provisioning.ProvisioningController).toBeDefined();
  });

  it('should export ProvisioningService', () => {
    expect(provisioning.ProvisioningService).toBeDefined();
  });

  it('should export ProvisioningModule', () => {
    expect(provisioning.ProvisioningModule).toBeDefined();
  });
});
