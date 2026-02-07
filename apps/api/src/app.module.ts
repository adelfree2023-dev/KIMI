import { Module } from '@nestjs/common';
import { ProvisioningModule } from './provisioning/provisioning.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ProvisioningModule
    ],
})
export class AppModule { }
