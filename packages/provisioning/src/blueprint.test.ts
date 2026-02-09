/**
 * Blueprint Service Tests
 * Super-#21: Onboarding Blueprint Editor
 */

import { publicDb } from '@apex/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type BlueprintTemplate,
  createBlueprint,
  defaultBlueprintTemplate,
  deleteBlueprint,
  getAllBlueprints,
  getBlueprintById,
  getDefaultBlueprint,
  updateBlueprint,
  validateBlueprint,
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
            name: 'Default',
            description: null,
            blueprint: JSON.stringify(defaultBlueprintTemplate),
            isDefault: 'false',
            plan: 'free',
            ...(v as Record<string, unknown>),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
          mockBlueprints.push(record);
          return [record];
        },
      }),
    }),
    update: () => ({
      set: (v: any) => ({
        where: () => ({
          returning: () => {
            const record = {
              id: 'test-id',
              name: v.name || 'Updated',
              blueprint:
                v.blueprint || JSON.stringify(defaultBlueprintTemplate),
              isDefault: v.isDefault || 'false',
              plan: v.plan || 'free',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            return [record];
          },
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

import { initializeDefaultBlueprint } from './blueprint.js';

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

    it('should reject non-object blueprint', () => {
      expect(() => validateBlueprint(null)).toThrow(
        'Blueprint must be an object'
      );
      expect(() => validateBlueprint('not an object')).toThrow(
        'Blueprint must be an object'
      );
    });

    it('should validate pages if present', () => {
      const validWithPages: BlueprintTemplate = {
        version: '1.0',
        name: 'Test',
        pages: [{ slug: 'test', title: 'Test Page', content: 'test content' }],
      };
      expect(() => validateBlueprint(validWithPages)).not.toThrow();
    });

    it('should reject invalid pages array', () => {
      const invalid = { version: '1.0', name: 'Test', pages: 'not an array' };
      expect(() => validateBlueprint(invalid)).toThrow(
        'pages must be an array'
      );
    });

    it('should reject page without slug or title', () => {
      const invalid = {
        version: '1.0',
        name: 'Test',
        pages: [{ content: 'test' }],
      };
      expect(() => validateBlueprint(invalid)).toThrow(
        'Page must have slug and title'
      );
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
        isDefault: true,
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

  describe('validateBlueprint edge cases', () => {
    it('should reject blueprint without name', () => {
      const bp = { ...defaultBlueprintTemplate, name: undefined };
      expect(() => validateBlueprint(bp as any)).toThrow(
        'Blueprint must have a name'
      );
    });

    it('should reject blueprint with empty name', () => {
      const bp = { ...defaultBlueprintTemplate, name: '' };
      expect(() => validateBlueprint(bp as any)).toThrow(
        'Blueprint must have a name'
      );
    });

    it('should reject blueprint without version', () => {
      const bp = { ...defaultBlueprintTemplate, version: undefined };
      expect(() => validateBlueprint(bp as any)).toThrow(
        'Blueprint version must be "1.0"'
      );
    });

    it('should reject product without name', () => {
      const bp = {
        ...defaultBlueprintTemplate,
        products: [{ price: 10 }],
      };
      expect(() => validateBlueprint(bp as any)).toThrow(
        'Product must have a name'
      );
    });

    it('should reject page without title', () => {
      const bp = {
        ...defaultBlueprintTemplate,
        pages: [{ slug: 'test' }],
      };
      expect(() => validateBlueprint(bp as any)).toThrow(
        'Page must have slug and title'
      );
    });
  });

  describe('getBlueprintById', () => {
    it('should return null for non-existent id', async () => {
      const result = await getBlueprintById('non-existent');
      expect(result).toBeNull();
    });

    it('should return blueprint record if exists', async () => {
      mockBlueprints.push({
        id: 'real-id',
        name: 'Test',
        description: null,
        blueprint: JSON.stringify(defaultBlueprintTemplate),
        isDefault: 'true',
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await getBlueprintById('real-id');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('real-id');
    });
  });

  describe('getDefaultBlueprint', () => {
    it('should return null when no blueprints exist', async () => {
      const result = await getDefaultBlueprint('free');
      expect(result).toBeNull();
    });

    it('should return a blueprint if no default is found but one exists for plan', async () => {
      mockBlueprints.push({
        id: 'bp-1',
        name: 'Non Default',
        description: null,
        blueprint: JSON.stringify(defaultBlueprintTemplate),
        isDefault: 'false',
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await getDefaultBlueprint('free');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Non Default');
      expect(result?.isDefault).toBe(false);
    });

    it('should return null when no blueprints exist for specific plan', async () => {
      const result = await getDefaultBlueprint('enterprise');
      expect(result).toBeNull();
    });
  });

  describe('updateBlueprint', () => {
    it('should update blueprint fields', async () => {
      const result = await updateBlueprint('test-id', {
        name: 'Updated Name',
        isDefault: true,
        plan: 'pro',
        blueprint: defaultBlueprintTemplate,
      });
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
      expect(result?.isDefault).toBe(true);
    });

    it('should handle partial updates', async () => {
      const result = await updateBlueprint('test-id', {
        description: 'New Description',
        isDefault: false,
      });
      expect(result).not.toBeNull();
    });

    it('should return null if update fails (no record found)', async () => {
      // Modify mock to return empty if id is wrong
      const originalUpdate = publicDb.update;
      (publicDb as any).update = () => ({
        set: () => ({
          where: () => ({
            returning: () => [],
          }),
        }),
      });

      const result = await updateBlueprint('wrong-id', { name: 'Fail' });
      expect(result).toBeNull();

      publicDb.update = originalUpdate;
    });
  });

  describe('deleteBlueprint', () => {
    it('should return true when deleted', async () => {
      const result = await deleteBlueprint('test-id');
      expect(result).toBe(true);
    });
  });

  describe('initializeDefaultBlueprint', () => {
    it('should create default if none exists', async () => {
      await initializeDefaultBlueprint();
      expect(mockBlueprints.length).toBeGreaterThan(0);
    });
  });
});
