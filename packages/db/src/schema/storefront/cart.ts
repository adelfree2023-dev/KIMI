/**
 * Storefront Cart Schema
 * 
 * Cart persistence table (primary storage is Redis).
 * 
 * @module @apex/db/schema/storefront/cart
 */

import {
    pgTable,
    uuid,
    varchar,
    decimal,
    jsonb,
    timestamp,
    index,
} from 'drizzle-orm/pg-core';
import { customers } from './customers';

/**
 * Carts Table (DB persistence, primary storage is Redis)
 */
export const carts = pgTable(
    'carts',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        customerId: uuid('customer_id').references(() => customers.id), // NULL for guest
        sessionId: varchar('session_id', { length: 64 }), // Guest cart key

        items: jsonb('items').notNull(), // Array of cart items
        subtotal: decimal('subtotal', { precision: 10, scale: 2 }),
        appliedCoupons: jsonb('applied_coupons'), // Array of applied coupons

        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
        expiresAt: timestamp('expires_at', { withTimezone: true }), // Auto-cleanup
    },
    (table) => [
        index('idx_carts_customer').on(table.customerId),
        index('idx_carts_session').on(table.sessionId),
        index('idx_carts_expires').on(table.expiresAt),
    ]
);

// Type exports
export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
