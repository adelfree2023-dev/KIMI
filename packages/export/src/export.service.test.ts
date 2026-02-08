/**
 * Export Service Tests
 * Verifies BullMQ queue management and job orchestration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ExportService } from './export.service.js';
import { ExportStrategyFactory } from './export-strategy.factory.js';
import type { ExportOptions } from './types.js';

// Mock BullMQ
vi.mock('bullmq', () => ({
    Queue: vi.fn().mockImplementation(() => ({
        add: vi.fn().mockResolvedValue({
            id: 'test-job-id',
            data: {},
            timestamp: Date.now(),
        }),
        getJob: vi.fn(),
        getJobs: vi.fn().mockResolvedValue([]),
        on: vi.fn(),
    })),
}));

// Mock audit service
const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
};

describe('ExportService', () => {
    let service: ExportService;
    let mockFactory: ExportStrategyFactory;

    beforeEach(() => {
        vi.clearAllMocks();
        mockFactory = {
            validateOptions: vi.fn().mockResolvedValue(true),
        } as any;

        service = new ExportService(mockFactory, mockAudit as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('createExportJob', () => {
        it('should create export job successfully', async () => {
            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'lite',
                requestedBy: 'user-456',
            };

            const job = await service.createExportJob(options);

            expect(job).toBeDefined();
            expect(job.tenantId).toBe('tenant-123');
            expect(job.profile).toBe('lite');
            expect(job.status).toBe('pending');
            expect(mockAudit.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'EXPORT_REQUESTED',
                    entityType: 'EXPORT',
                    tenantId: 'tenant-123',
                })
            );
        });

        it('should reject invalid export options', async () => {
            mockFactory.validateOptions = vi.fn().mockResolvedValue(false);

            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'lite',
                requestedBy: 'user-456',
            };

            await expect(service.createExportJob(options)).rejects.toThrow(
                'Invalid export options'
            );
        });

        it('should prevent concurrent exports for same tenant', async () => {
            const mockQueue = (service as any).exportQueue;
            mockQueue.getJobs = vi.fn().mockResolvedValue([
                {
                    id: 'existing-job',
                    data: { tenantId: 'tenant-123' },
                },
            ]);

            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'lite',
                requestedBy: 'user-456',
            };

            await expect(service.createExportJob(options)).rejects.toThrow(
                'Export already in progress'
            );
        });

        it('should detect duplicate requests within cooldown period', async () => {
            const mockQueue = (service as any).exportQueue;
            mockQueue.getJobs = vi.fn().mockImplementation((states) => {
                if (states.includes('completed')) {
                    return Promise.resolve([
                        {
                            id: 'recent-job',
                            data: { tenantId: 'tenant-123', profile: 'lite' },
                            processedOn: Date.now() - 30000, // 30 seconds ago
                        },
                    ]);
                }
                return Promise.resolve([]);
            });

            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'lite',
                requestedBy: 'user-456',
            };

            await expect(service.createExportJob(options)).rejects.toThrow(
                'Duplicate export request'
            );
        });

        it('should allow export with different profile', async () => {
            const mockQueue = (service as any).exportQueue;
            mockQueue.getJobs = vi.fn().mockImplementation((states) => {
                if (states.includes('completed')) {
                    return Promise.resolve([
                        {
                            id: 'recent-job',
                            data: { tenantId: 'tenant-123', profile: 'native' },
                            processedOn: Date.now() - 30000,
                        },
                    ]);
                }
                return Promise.resolve([]);
            });

            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'lite', // Different profile
                requestedBy: 'user-456',
            };

            const job = await service.createExportJob(options);
            expect(job).toBeDefined();
        });
    });

    describe('getJobStatus', () => {
        it('should return job status', async () => {
            const mockQueue = (service as any).exportQueue;
            mockQueue.getJob = vi.fn().mockResolvedValue({
                id: 'job-123',
                data: {
                    tenantId: 'tenant-123',
                    profile: 'lite',
                    requestedBy: 'user-456',
                },
                timestamp: Date.now(),
                getState: vi.fn().mockResolvedValue('active'),
                progress: 50,
            });

            const status = await service.getJobStatus('job-123');

            expect(status).toBeDefined();
            expect(status?.id).toBe('job-123');
            expect(status?.status).toBe('processing');
            expect(status?.progress).toBe(50);
        });

        it('should return null for non-existent job', async () => {
            const mockQueue = (service as any).exportQueue;
            mockQueue.getJob = vi.fn().mockResolvedValue(null);

            const status = await service.getJobStatus('non-existent');
            expect(status).toBeNull();
        });
    });

    describe('cancelJob', () => {
        it('should cancel pending job', async () => {
            const mockJob = {
                id: 'job-123',
                data: { tenantId: 'tenant-123' },
                getState: vi.fn().mockResolvedValue('waiting'),
                remove: vi.fn().mockResolvedValue(undefined),
            };

            const mockQueue = (service as any).exportQueue;
            mockQueue.getJob = vi.fn().mockResolvedValue(mockJob);

            const result = await service.cancelJob('job-123');

            expect(result).toBe(true);
            expect(mockJob.remove).toHaveBeenCalled();
            expect(mockAudit.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'EXPORT_CANCELLED',
                })
            );
        });

        it('should not cancel completed job', async () => {
            const mockJob = {
                id: 'job-123',
                data: { tenantId: 'tenant-123' },
                getState: vi.fn().mockResolvedValue('completed'),
                remove: vi.fn(),
            };

            const mockQueue = (service as any).exportQueue;
            mockQueue.getJob = vi.fn().mockResolvedValue(mockJob);

            const result = await service.cancelJob('job-123');

            expect(result).toBe(false);
            expect(mockJob.remove).not.toHaveBeenCalled();
        });
    });

    describe('listTenantExports', () => {
        it('should list all exports for tenant', async () => {
            const mockQueue = (service as any).exportQueue;
            mockQueue.getJobs = vi.fn().mockResolvedValue([
                {
                    id: 'job-1',
                    data: { tenantId: 'tenant-123', profile: 'lite', requestedBy: 'user-1' },
                    timestamp: Date.now(),
                    getState: vi.fn().mockReturnValue('completed'),
                },
                {
                    id: 'job-2',
                    data: { tenantId: 'tenant-123', profile: 'native', requestedBy: 'user-1' },
                    timestamp: Date.now(),
                    getState: vi.fn().mockReturnValue('active'),
                },
                {
                    id: 'job-3',
                    data: { tenantId: 'tenant-456', profile: 'lite', requestedBy: 'user-2' },
                    timestamp: Date.now(),
                    getState: vi.fn().mockReturnValue('completed'),
                },
            ]);

            const exports = await service.listTenantExports('tenant-123');

            expect(exports).toHaveLength(2);
            expect(exports[0].tenantId).toBe('tenant-123');
            expect(exports[1].tenantId).toBe('tenant-123');
        });
    });

    describe('mapJobState', () => {
        it('should map job states correctly', () => {
            expect((service as any).mapJobState('waiting')).toBe('pending');
            expect((service as any).mapJobState('delayed')).toBe('pending');
            expect((service as any).mapJobState('active')).toBe('processing');
            expect((service as any).mapJobState('completed')).toBe('completed');
            expect((service as any).mapJobState('failed')).toBe('failed');
        });
    });
});
