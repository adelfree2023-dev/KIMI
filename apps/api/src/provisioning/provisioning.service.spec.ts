import { AuditService } from '@apex/audit';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProvisioningService } from './provisioning.service.js';

describe('ProvisioningService', () => {
  let service: ProvisioningService;

  const mockAuditService = {
    log: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvisioningService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ProvisioningService>(ProvisioningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have a provision method', () => {
    expect(service.provision).toBeDefined();
  });
});
