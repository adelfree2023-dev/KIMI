import { AuditService } from '@apex/audit';
import { Module } from '@nestjs/common';
import { ProvisioningController } from './provisioning.controller.js';
import { ProvisioningService } from './provisioning.service.js';

@Module({
  controllers: [ProvisioningController],
  providers: [
    {
      provide: 'PROVISIONING_SERVICE',
      useClass: ProvisioningService,
    },
    {
      provide: 'AUDIT_SERVICE',
      useClass: AuditService,
    },
  ],
  exports: ['PROVISIONING_SERVICE'],
})
export class ProvisioningModule {}
