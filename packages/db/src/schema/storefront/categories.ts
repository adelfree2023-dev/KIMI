/**
 * Storefront Category Schema
 *
 * Product categorization tables for templates.
 *
 * @module @apex/db/schema/storefront/categories
 */

import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Categories Table (supports nested hierarchy)
 */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'), // Category banner

    parentId: uuid('parent_id').references((): any => categories.id), // Self-reference

    order: integer('order').default(0), // Display order
    isActive: boolean('is_active').default(true),
  },
  (table) => ({
    idxCategoriesParent: index('idx_categories_parent').on(table.parentId),
    idxCategoriesActive: index('idx_categories_active').on(table.isActive),
  })
);

// Type exports
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
