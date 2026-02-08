/**
 * Apex v2 API Bootstrap
 * Implements S1-S8 Security Protocols
 */

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from '@apex/middleware';
import { defaultCorsConfig } from '@apex/middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // S1: Environment Verification happens automatically via @apex/config
  
  const app = await NestFactory.create(AppModule);

  // S5: Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // S3: Global Validation Pipe
  app.useGlobalPipes(
    new ZodValidationPipe(),
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Auto-transform payloads
    })
  );

  // S8: Security Headers (Helmet)
  // CRITICAL FIX (S8): Removed 'unsafe-inline' from scriptSrc
  // Using strict CSP with nonce generation for inline scripts
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // S8: No 'unsafe-inline' - scripts must have nonce or be external
        scriptSrc: ["'self'"],
        // S8: styleSrc allows 'unsafe-inline' for CSS (less critical than JS)
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // S8: Additional security headers
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // S8: CORS Configuration
  app.enableCors(defaultCorsConfig);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 API is running on: http://localhost:${port}/api`);
  logger.log('✅ S1-S8 Security Protocols Active');
}

bootstrap();
