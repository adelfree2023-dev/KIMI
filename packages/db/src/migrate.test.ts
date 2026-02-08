/**
 * Database Migration Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('Migration Script', () => {
  let mockPool: any;
  let mockDrizzle: any;
  let mockMigrate: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup console spies
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    // Setup mock pool
    mockPool = {
      end: vi.fn().mockResolvedValue(undefined),
    };

    // Setup mock drizzle
    mockDrizzle = vi.fn();

    // Setup mock migrate
    mockMigrate = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runMigrations', () => {
    it('should log migration start message', async () => {
      vi.doMock('pg', () => ({
        default: {
          Pool: vi.fn().mockReturnValue(mockPool),
        },
      }));

      vi.doMock('drizzle-orm/node-postgres', () => ({
        drizzle: vi.fn().mockReturnValue(mockDrizzle),
      }));

      vi.doMock('drizzle-orm/node-postgres/migrator', () => ({
        migrate: mockMigrate,
      }));

      vi.doMock('@apex/config', () => ({
        validateEnv: vi.fn().mockReturnValue({
          DATABASE_URL: 'postgresql://localhost:5432/test',
        }),
      }));

      const { runMigrations } = await import('./migrate.js');
      
      // Note: The actual module runs migrations immediately
      // This test validates the structure exists
      expect(consoleLogSpy).toHaveBeenCalledWith('Running migrations...');
    });

    it('should create pool with correct connection string', async () => {
      const Pool = vi.fn().mockReturnValue(mockPool);
      
      vi.doMock('pg', () => ({
        default: { Pool },
      }));

      await import('./migrate.js');
      
      expect(Pool).toHaveBeenCalledWith({
        connectionString: expect.any(String),
      });
    });

    it('should call migrate with correct parameters', async () => {
      const migrate = vi.fn().mockResolvedValue(undefined);
      
      vi.doMock('drizzle-orm/node-postgres/migrator', () => ({
        migrate,
      }));

      await import('./migrate.js');
      
      expect(migrate).toHaveBeenCalledWith(
        expect.anything(),
        { migrationsFolder: './drizzle' }
      );
    });

    it('should log success message after migration', async () => {
      await import('./migrate.js');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Migrations completed successfully');
    });

    it('should handle migration errors', async () => {
      const migrate = vi.fn().mockRejectedValue(new Error('Migration failed'));
      
      vi.doMock('drizzle-orm/node-postgres/migrator', () => ({
        migrate,
      }));

      await import('./migrate.js');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Migration failed:',
        expect.any(Error)
      );
    });

    it('should exit process on migration failure', async () => {
      const migrate = vi.fn().mockRejectedValue(new Error('Migration failed'));
      
      vi.doMock('drizzle-orm/node-postgres/migrator', () => ({
        migrate,
      }));

      await import('./migrate.js');
      
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should close pool connection in finally block', async () => {
      await import('./migrate.js');
      
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should close pool even on error', async () => {
      const migrate = vi.fn().mockRejectedValue(new Error('Migration failed'));
      
      vi.doMock('drizzle-orm/node-postgres/migrator', () => ({
        migrate,
      }));

      await import('./migrate.js');
      
      expect(mockPool.end).toHaveBeenCalled();
    });
  });

  describe('Environment validation', () => {
    it('should validate environment variables', async () => {
      const validateEnv = vi.fn().mockReturnValue({
        DATABASE_URL: 'postgresql://localhost:5432/test',
      });
      
      vi.doMock('@apex/config', () => ({
        validateEnv,
      }));

      await import('./migrate.js');
      
      expect(validateEnv).toHaveBeenCalled();
    });

    it('should use validated DATABASE_URL', async () => {
      const Pool = vi.fn().mockReturnValue(mockPool);
      
      vi.doMock('pg', () => ({
        default: { Pool },
      }));

      vi.doMock('@apex/config', () => ({
        validateEnv: vi.fn().mockReturnValue({
          DATABASE_URL: 'postgresql://custom-host:5432/custom-db',
        }),
      }));

      await import('./migrate.js');
      
      expect(Pool).toHaveBeenCalledWith({
        connectionString: 'postgresql://custom-host:5432/custom-db',
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full migration flow', async () => {
      const migrate = vi.fn().mockResolvedValue(undefined);
      const Pool = vi.fn().mockReturnValue(mockPool);
      const drizzle = vi.fn().mockReturnValue({});
      
      vi.doMock('pg', () => ({
        default: { Pool },
      }));

      vi.doMock('drizzle-orm/node-postgres', () => ({
        drizzle,
      }));

      vi.doMock('drizzle-orm/node-postgres/migrator', () => ({
        migrate,
      }));

      vi.doMock('@apex/config', () => ({
        validateEnv: vi.fn().mockReturnValue({
          DATABASE_URL: 'postgresql://localhost:5432/test',
        }),
      }));

      await import('./migrate.js');
      
      // Verify the complete flow
      expect(consoleLogSpy).toHaveBeenCalledWith('Running migrations...');
      expect(Pool).toHaveBeenCalled();
      expect(drizzle).toHaveBeenCalledWith(mockPool);
      expect(migrate).toHaveBeenCalledWith(
        expect.anything(),
        { migrationsFolder: './drizzle' }
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Migrations completed successfully');
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle pool connection errors', async () => {
      const Pool = vi.fn().mockImplementation(() => {
        throw new Error('Connection refused');
      });
      
      vi.doMock('pg', () => ({
        default: { Pool },
      }));

      await import('./migrate.js');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Migration failed:',
        expect.any(Error)
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
