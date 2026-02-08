/**
 * @apex/export - Tenant Data Export System
 * 
 * Features:
 * - Strategy Pattern for multiple export formats (lite/native/analytics)
 * - BullMQ queue with Redis for background processing
 * - S2: Strict tenant isolation
 * - S4: Comprehensive audit logging
 * - S7: Secure presigned URLs with 24h TTL
 */

export { ExportModule } from './export.module.js';
export { ExportService } from './export.service.js';
export { ExportWorker } from './export.worker.js';
export { ExportController } from './export.controller.js';
export { ExportStrategyFactory } from './export-strategy.factory.js';

export type {
  ExportProfile,
  ExportJob,
  ExportResult,
  ExportManifest,
  ExportOptions,
  ExportStrategy,
} from './types.js';

export { LiteExportStrategy } from './strategies/lite-export.strategy.js';
export { NativeExportStrategy } from './strategies/native-export.strategy.js';
export { AnalyticsExportStrategy } from './strategies/analytics-export.strategy.js';
