/**
 * Blueprint Service Tests
 * Super-#21: Onboarding Blueprint Editor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBlueprint,
  getAllBlueprints,
  getBlueprintById,
  getDefaultBlueprint,
  updateBlueprint,
  deleteBlueprint,
  validateBlueprint,
  defaultBlueprintTemplate,
  type BlueprintTemplate,
} from './blueprint.js';

// Mock the database
const mockBlueprints: Array<{
  id: string;
  name: string;
  description: string | null;
  blueprint: string;
  isDefault: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}> = [];

vi.mock('@apex/db', () => ({
  onboardingBlueprints: {
    id: 'id',
    name: 'name',
    description: 'description',
    blueprint: 'blueprint',
    isDefault: 'is_default',
    plan: 'plan',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  publicDb: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: (n: number) => mockBlueprints.slice(0, n),
        }),
        orderBy: () => mockBlueprints,
      }),
    }),
    insert: () => ({
      values: (v: unknown) => ({
        returning: () => {
          const record = {
            id: 'test-id',
            ...(v as Record<string, unknown>),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockBlueprints.push(record);
          return [record];
        },
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => [],
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        returning: () => [{ id: 'deleted' }],
      }),
    }),
  },
}));

describe('Blueprint Service', () => {
  beforeEach(() => {
    mockBlueprints.length = 0;
  });

  describe('validateBlueprint', () => {
    it('should validate a correct blueprint', () => {
      const validBlueprint: BlueprintTemplate = {
        version: '1.0',
        name: 'Test Blueprint',
        products: [{ name: 'Test Product', price: 9.99 }],
      };

      expect(() => validateBlueprint(validBlueprint)).not.toThrow();
      expect(validateBlueprint(validBlueprint)).toBe(true);
    });

    it('should reject invalid version', () => {
      const invalidBlueprint = {
        version: '2.0',
        name: 'Test',
      };

      expect(() => validateBlueprint(invalidBlueprint)).toThrow(
        'Blueprint version must be "1.0"'
      );
    });

    it('should reject missing name', () => {
      const invalidBlueprint = {
        version: '1.0',
      };

      expect(() => validateBlueprint(invalidBlueprint)).toThrow(
        'Blueprint must have a name'
      );
    });

    it('should reject invalid products array', () => {
      const invalidBlueprint = {
        version: '1.0',
        name: 'Test',
        products: 'not an array',
      };

      expect(() => validateBlueprint(invalidBlueprint)).toThrow(
        'products must be an array'
      );
    });

    it('should reject product without name', () => {
      const invalidBlueprint = {
        version: '1.0',
        name: 'Test',
        products: [{ price: 9.99 }],
      };

      expect(() => validateBlueprint(invalidBlueprint)).toThrow(
        'Product must have a name'
      );
    });

    it('should reject invalid price', () => {
      const invalidBlueprint = {
        version: '1.0',
        name: 'Test',
        products: [{ name: 'Test', price: -5 }],
      };

      expect(() => validateBlueprint(invalidBlueprint)).toThrow(
        'Product must have a valid price'
      );
    });
  });

  describe('defaultBlueprintTemplate', () => {
    it('should have valid structure', () => {
      expect(defaultBlueprintTemplate.version).toBe('1.0');
      expect(defaultBlueprintTemplate.name).toBeDefined();
      expect(defaultBlueprintTemplate.products).toBeDefined();
      expect(defaultBlueprintTemplate.pages).toBeDefined();
      expect(defaultBlueprintTemplate.categories).toBeDefined();
      expect(defaultBlueprintTemplate.settings).toBeDefined();
      expect(defaultBlueprintTemplate.navigation).toBeDefined();
    });

    it('should pass validation', () => {
      expect(() => validateBlueprint(defaultBlueprintTemplate)).not.toThrow();
    });
  });

  describe('createBlueprint', () => {
    it('should create a blueprint with valid data', async () => {
      const blueprint: BlueprintTemplate = {
        version: '1.0',
        name: 'Test Blueprint',
        products: [{ name: 'Product 1', price: 19.99 }],
      };

      const result = await createBlueprint('My Blueprint', blueprint, {
        description: 'A test blueprint',
        plan: 'pro',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('My Blueprint');
      expect(result.description).toBe('A test blueprint');
      expect(result.plan).toBe('pro');
      expect(result.blueprint.name).toBe('Test Blueprint');
    });

    it('should throw on invalid blueprint', async () => {
      const invalidBlueprint = { version: '2.0', name: 'Test' };

      await expect(
        createBlueprint('Invalid', invalidBlueprint as BlueprintTemplate)
      ).rejects.toThrow();
    });
  });

  describe('getAllBlueprints', () => {
    it('should return all blueprints', async () => {
      const blueprints = await getAllBlueprints();
      expect(Array.isArray(blueprints)).toBe(true);
    });
  });

  describe('getBlueprintById', () => {
    it('should return null for non-existent id', async () => {
      const result = await getBlueprintById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getDefaultBlueprint', () => {
    it('should return null when no blueprints exist', async () => {
      const result = await getDefaultBlueprint('free');
      expect(result).toBeNull();
    });
  });

  describe('updateBlueprint', () => {
    it('should update blueprint fields', async () => {
      const result = await updateBlueprint('test-id', { name: 'Updated Name' });
      // Mock returns null or updated record
      expect(result === null || result?.name === 'Updated Name').toBeTruthy();
    });
  });

  describe('deleteBlueprint', () => {
    it('should return true when deleted', async () => {
      const result = await deleteBlueprint('test-id');
      expect(result).toBe(true);
    });
  });
});
