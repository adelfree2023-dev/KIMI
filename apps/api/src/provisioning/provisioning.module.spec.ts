import { describe, it, expect } from 'vitest';
import { ProvisioningModule } from './provisioning.module.js';

describe('ProvisioningModule', () => {
  it('should be defined', () => {
    expect(ProvisioningModule).toBeDefined();
  });

  it('should have correct imports', () => {
    expect(ProvisioningModule.imports).toBeDefined();
  });

  it('should have correct controllers', () => {
    expect(ProvisioningModule.controllers).toBeDefined();
  });

  it('should have correct providers', () => {
    expect(ProvisioningModule.providers).toBeDefined();
  });
});
