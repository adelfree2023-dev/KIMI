/**
 * Tenant Data Export System - Type Definitions
 * S2 Compliant: Strict tenant isolation during export
 */

export type ExportProfile = 'lite' | 'native' | 'analytics';

export interface ExportJob {
  id: string;
  tenantId: string;
  profile: ExportProfile;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: ExportResult;
  error?: string;
}

export interface ExportResult {
  downloadUrl: string;
  expiresAt: Date;
  sizeBytes: number;
  checksum: string;
  manifest: ExportManifest;
}

export interface ExportManifest {
  tenantId: string;
  exportedAt: string;
  profile: ExportProfile;
  database: {
    tables: string[];
    rowCount: number;
    format: 'sql' | 'json' | 'csv';
  };
  assets: {
    files: string[];
    totalSize: number;
  };
  version: string;
}

export interface ExportOptions {
  tenantId: string;
  profile: ExportProfile;
  requestedBy: string;
  includeAssets?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ExportStrategy {
  readonly name: ExportProfile;
  export(options: ExportOptions): Promise<ExportResult>;
  validate(options: ExportOptions): Promise<boolean>;
}
