import { describe, it, expect, vi } from 'vitest';
import {
  InMemoryEventBus,
  validateEvent,
  TenantProvisioningStartedSchema,
  createEventId,
  createCorrelationId,
  createTimestamp,
} from './index.js';

describe('Event Bus', () => {
  describe('InMemoryEventBus', () => {
    it('should publish and subscribe to events', async () => {
      const bus = new InMemoryEventBus();
      const handler = vi.fn();
      
      bus.subscribe('tenant.provisioning.started', handler);
      
      const event = {
        eventId: createEventId(),
        eventType: 'tenant.provisioning.started' as const,
        timestamp: createTimestamp(),
        tenantId: 'test-tenant',
        payload: {
          subdomain: 'test',
          plan: 'free' as const,
          adminEmail: 'test@example.com',
        },
      };
      
      await bus.publish(event);
      
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should support multiple subscribers', async () => {
      const bus = new InMemoryEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      bus.subscribe('tenant.provisioning.started', handler1);
      bus.subscribe('tenant.provisioning.started', handler2);
      
      const event = {
        eventId: createEventId(),
        eventType: 'tenant.provisioning.started' as const,
        timestamp: createTimestamp(),
        tenantId: 'test-tenant',
        payload: {
          subdomain: 'test',
          plan: 'free' as const,
          adminEmail: 'test@example.com',
        },
      };
      
      await bus.publish(event);
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('validateEvent', () => {
    it('should validate correct event', () => {
      const event = {
        eventId: createEventId(),
        eventType: 'tenant.provisioning.started',
        timestamp: createTimestamp(),
        tenantId: 'test-tenant',
        payload: {
          subdomain: 'test',
          plan: 'free',
          adminEmail: 'test@example.com',
        },
      };
      
      const result = validateEvent(TenantProvisioningStartedSchema, event);
      expect(result).toBeDefined();
    });

    it('should throw for invalid event', () => {
      const invalidEvent = {
        eventId: 'invalid-uuid',
        eventType: 'tenant.provisioning.started',
        timestamp: 'invalid-date',
        tenantId: 'test',
        payload: {},
      };
      
      expect(() => validateEvent(TenantProvisioningStartedSchema, invalidEvent)).toThrow();
    });
  });

  describe('helpers', () => {
    it('should create valid UUID for eventId', () => {
      const id = createEventId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create valid UUID for correlationId', () => {
      const id = createCorrelationId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create valid ISO timestamp', () => {
      const ts = createTimestamp();
      expect(new Date(ts).toISOString()).toBe(ts);
    });
  });
});
