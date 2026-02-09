/**
 * Apex v2 API Root Module
 * Configures S1-S8 Security Protocols
 */

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module.js';
import { ProvisioningModule } from './provisioning/provisioning.module.js';
import { TenantIsolationMiddleware } from '@apex/middleware';

@Module({
  imports: [
    // S1: Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.s1.local'],
    }),

    // S6: Rate Limiting (Throttler)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000'),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 10, // For auth endpoints
      },
    ]),

    // Feature Modules
    HealthModule,
    ProvisioningModule,
  ],
  providers: [
    // S6: Apply Rate Limiting Globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Note: RateLimitGuard is HTTP-specific and applied per-controller
    // Not registered globally to avoid CLI context issues
  ],
})
export class AppModule implements NestModule {
  // S2: Apply Tenant Isolation Middleware
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantIsolationMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
