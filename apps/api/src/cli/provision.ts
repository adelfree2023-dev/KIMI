#!/usr/bin/env bun
/**
 * CLI Tool for Tenant Provisioning
 * Usage: bun run cli provision --subdomain=<name> --plan=<plan> --email=<email> --password=<pass> --store-name=<name>
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { ProvisioningService } from '../provisioning/provisioning.service.js';

interface ProvisionOptions {
  subdomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  email: string;
  password: string;
  storeName: string;
  quiet?: boolean;
}

function parseArgs(): ProvisionOptions {
  const args = process.argv.slice(2);
  const options: Partial<ProvisionOptions> = {};

  for (const arg of args) {
    if (arg.startsWith('--subdomain=')) {
      options.subdomain = arg.split('=')[1];
    } else if (arg.startsWith('--plan=')) {
      options.plan = arg.split('=')[1] as any;
    } else if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
    } else if (arg.startsWith('--password=')) {
      options.password = arg.split('=')[1];
    } else if (arg.startsWith('--store-name=')) {
      options.storeName = arg.split('=')[1];
    } else if (arg === '--quiet') {
      options.quiet = true;
    }
  }

  if (!options.subdomain || !options.email || !options.password || !options.storeName) {
    console.error('❌ Missing required arguments');
    console.error('Usage: bun run cli provision --subdomain=<name> --plan=<plan> --email=<email> --password=<pass> --store-name=<name>');
    process.exit(1);
  }

  return options as ProvisionOptions;
}

async function main() {
  const options = parseArgs();

  if (!options.quiet) {
    console.log(`🚀 Starting provisioning for: ${options.subdomain}`);
  }

  try {
    // Create NestJS application context (without HTTP server)
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'], // Always show errors and warnings
    });

    const provisioningService = app.get<ProvisioningService>('PROVISIONING_SERVICE' as any);

    // Execute provisioning
    const result = await provisioningService.provision({
      subdomain: options.subdomain,
      storeName: options.storeName,
      adminEmail: options.email,
      plan: options.plan || 'basic',
    });

    if (!options.quiet) {
      console.log('✅ Provisioning completed successfully');
      console.log(`   Tenant ID: ${result.subdomain}`);
      console.log(`   Duration: ${result.durationMs}ms`);
    }

    await app.close();
  } catch (error) {
    console.error('❌ Provisioning failed:', error instanceof Error ? error.message : error);
    // Stack traces only in development mode for security
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      console.error('Stack:', (error as Error)['stack']);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Fatal CLI Error:', err);
  process.exit(1);
});
