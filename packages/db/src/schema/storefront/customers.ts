/**
 * Storefront Customer Schema
 *
 * Customer and address tables for templates.
 *
 * @module @apex/db/schema/storefront/customers
 */

import {
  boolean,
  char,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Customers Table
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    email: varchar('email', { length: 255 }).notNull().unique(), // S7: Encrypted in search index
    passwordHash: text('password_hash'), // Argon2id

    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }), // S7: Encrypted
    avatarUrl: text('avatar_url'),

    isVerified: boolean('is_verified').default(false),

    // Loyalty & Wallet
    loyaltyPoints: integer('loyalty_points').default(0),
    walletBalance: decimal('wallet_balance', {
      precision: 10,
      scale: 2,
    }).default('0'),

    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxCustomersEmail: index('idx_customers_email').on(table.email),
  })
);

/**
 * Customer Addresses Table
 */
export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),

    label: varchar('label', { length: 50 }), // "Home", "Work"
    name: varchar('name', { length: 255 }).notNull(), // Recipient name

    line1: varchar('line1', { length: 255 }).notNull(),
    line2: varchar('line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: char('country', { length: 2 }).notNull(), // ISO 3166-1 alpha-2

    phone: varchar('phone', { length: 20 }), // S7: Encrypted
    isDefault: boolean('is_default').default(false),
  },
  (table) => ({
    idxCustomerAddressesCustomer: index('idx_customer_addresses_customer').on(
      table.customerId
    ),
  })
);

// Type exports
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type NewCustomerAddress = typeof customerAddresses.$inferInsert;
