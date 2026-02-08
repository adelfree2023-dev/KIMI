# 🗄️ Template Database Schema
*Required Tables for Storefront Templates | S2 Tenant Isolation Enforced*

---

## 🎯 Purpose

This document defines the **minimum database schema** required for a storefront template to function. All tables exist within tenant-specific PostgreSQL schemas (`tenant_{id}`).

---

## 🔷 Schema Isolation Architecture

```
PostgreSQL Instance
├── public (shared metadata)
│   ├── tenants              # Tenant registry
│   ├── onboarding_blueprints # Template seed data
│   ├── feature_flags        # Cross-tenant feature toggles
│   └── audit_logs           # Immutable audit trail
│
├── tenant_alpha (Tenant A)
│   ├── products
│   ├── categories
│   ├── orders
│   ├── customers
│   └── ... (all tenant data)
│
└── tenant_beta (Tenant B)
    ├── products
    ├── categories
    └── ... (completely isolated)
```

---

## 🔷 1. Core Product Tables

### products
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `slug` | `varchar(255)` | UNIQUE, NOT NULL | URL-friendly identifier |
| `name` | `varchar(255)` | NOT NULL | Product name |
| `description` | `text` | | Full description (HTML allowed) |
| `short_description` | `varchar(500)` | | Summary for cards |
| `price` | `decimal(10,2)` | NOT NULL, CHECK > 0 | Sale price |
| `compare_at_price` | `decimal(10,2)` | CHECK > price | Original price |
| `cost_price` | `decimal(10,2)` | | S7: Encrypted at rest |
| `currency` | `char(3)` | NOT NULL, DEFAULT 'USD' | ISO 4217 |
| `category_id` | `uuid` | FK → categories(id) | Primary category |
| `brand` | `varchar(100)` | | Brand name |
| `sku` | `varchar(100)` | UNIQUE | Stock Keeping Unit |
| `barcode` | `varchar(50)` | | UPC/EAN |
| `quantity` | `integer` | NOT NULL, DEFAULT 0 | Stock count |
| `track_inventory` | `boolean` | DEFAULT true | Enable stock tracking |
| `weight` | `decimal(8,3)` | | Weight in kg |
| `is_active` | `boolean` | DEFAULT true | Visibility flag |
| `is_featured` | `boolean` | DEFAULT false | Homepage feature |
| `meta_title` | `varchar(60)` | | SEO title |
| `meta_description` | `varchar(160)` | | SEO description |
| `created_at` | `timestamptz` | DEFAULT NOW() | |
| `updated_at` | `timestamptz` | DEFAULT NOW() | Auto-updated trigger |

**Indexes:**
- `idx_products_slug` ON (slug)
- `idx_products_category` ON (category_id)
- `idx_products_active` ON (is_active) WHERE is_active = true
- `idx_products_search` USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')))

### product_images
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `product_id` | `uuid` | FK → products(id) ON DELETE CASCADE | |
| `url` | `text` | NOT NULL | MinIO signed URL |
| `alt_text` | `varchar(255)` | | Accessibility |
| `is_primary` | `boolean` | DEFAULT false | Main display image |
| `order` | `integer` | DEFAULT 0 | Gallery order |

### product_variants
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `product_id` | `uuid` | FK → products(id) ON DELETE CASCADE | |
| `sku` | `varchar(100)` | UNIQUE | Variant SKU |
| `name` | `varchar(255)` | | e.g., "Red / XL" |
| `price` | `decimal(10,2)` | NOT NULL | Variant-specific price |
| `compare_at_price` | `decimal(10,2)` | | |
| `quantity` | `integer` | NOT NULL, DEFAULT 0 | |
| `attributes` | `jsonb` | NOT NULL | {"color": "Red", "size": "XL"} |
| `image_url` | `text` | | Variant-specific image |

**Indexes:**
- `idx_variants_product` ON (product_id)
- `idx_variants_attributes` USING GIN (attributes)

### product_tags
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `product_id` | `uuid` | FK → products(id) ON DELETE CASCADE | |
| `tag` | `varchar(50)` | NOT NULL | |
| | | PK (product_id, tag) | |

---

## 🔷 2. Category Tables

### categories
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `slug` | `varchar(255)` | UNIQUE, NOT NULL | |
| `name` | `varchar(255)` | NOT NULL | |
| `description` | `text` | | |
| `image_url` | `text` | | Category banner |
| `parent_id` | `uuid` | FK → categories(id) | Nested categories |
| `order` | `integer` | DEFAULT 0 | Display order |
| `is_active` | `boolean` | DEFAULT true | |

**Indexes:**
- `idx_categories_parent` ON (parent_id)
- `idx_categories_active` ON (is_active)

---

## 🔷 3. Customer Tables

### customers
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | S7: Encrypted in search index |
| `password_hash` | `text` | | Argon2id |
| `first_name` | `varchar(100)` | | |
| `last_name` | `varchar(100)` | | |
| `phone` | `varchar(20)` | | S7: Encrypted |
| `avatar_url` | `text` | | |
| `is_verified` | `boolean` | DEFAULT false | Email verified |
| `loyalty_points` | `integer` | DEFAULT 0 | |
| `wallet_balance` | `decimal(10,2)` | DEFAULT 0 | |
| `last_login_at` | `timestamptz` | | |
| `created_at` | `timestamptz` | DEFAULT NOW() | |

**Indexes:**
- `idx_customers_email` ON (email)

### customer_addresses
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `customer_id` | `uuid` | FK → customers(id) ON DELETE CASCADE | |
| `label` | `varchar(50)` | | "Home", "Work" |
| `name` | `varchar(255)` | NOT NULL | Recipient name |
| `line1` | `varchar(255)` | NOT NULL | Street address |
| `line2` | `varchar(255)` | | Apt, Suite |
| `city` | `varchar(100)` | NOT NULL | |
| `state` | `varchar(100)` | | |
| `postal_code` | `varchar(20)` | NOT NULL | |
| `country` | `char(2)` | NOT NULL | ISO 3166-1 alpha-2 |
| `phone` | `varchar(20)` | | S7: Encrypted |
| `is_default` | `boolean` | DEFAULT false | |

---

## 🔷 4. Order Tables

### orders
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `order_number` | `varchar(20)` | UNIQUE, NOT NULL | ORD-2026-XXXXX |
| `customer_id` | `uuid` | FK → customers(id) | NULL for guest |
| `guest_email` | `varchar(255)` | | For guest orders |
| `status` | `varchar(20)` | NOT NULL | Enum in app |
| `payment_status` | `varchar(20)` | NOT NULL | |
| `subtotal` | `decimal(10,2)` | NOT NULL | |
| `discount` | `decimal(10,2)` | DEFAULT 0 | |
| `shipping` | `decimal(10,2)` | DEFAULT 0 | |
| `tax` | `decimal(10,2)` | DEFAULT 0 | |
| `total` | `decimal(10,2)` | NOT NULL | |
| `currency` | `char(3)` | NOT NULL | |
| `payment_method` | `varchar(20)` | | card, cod, wallet |
| `shipping_address` | `jsonb` | NOT NULL | Snapshot of address |
| `billing_address` | `jsonb` | NOT NULL | |
| `notes` | `text` | | Customer notes |
| `tracking_number` | `varchar(100)` | | |
| `tracking_url` | `text` | | |
| `created_at` | `timestamptz` | DEFAULT NOW() | |
| `updated_at` | `timestamptz` | DEFAULT NOW() | |
| `shipped_at` | `timestamptz` | | |
| `delivered_at` | `timestamptz` | | |

**Indexes:**
- `idx_orders_customer` ON (customer_id)
- `idx_orders_status` ON (status)
- `idx_orders_created` ON (created_at DESC)
- `idx_orders_number` ON (order_number)

### order_items
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `order_id` | `uuid` | FK → orders(id) ON DELETE CASCADE | |
| `product_id` | `uuid` | | Snapshot, no FK |
| `variant_id` | `uuid` | | |
| `name` | `varchar(255)` | NOT NULL | Frozen name |
| `sku` | `varchar(100)` | | |
| `price` | `decimal(10,2)` | NOT NULL | Frozen price |
| `quantity` | `integer` | NOT NULL | |
| `attributes` | `jsonb` | | Frozen variant attrs |
| `image_url` | `text` | | |

---

## 🔷 5. Cart Tables (Redis-backed, persisted on checkout)

### carts (Optional DB persistence)
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `customer_id` | `uuid` | FK → customers(id) | NULL for guest |
| `session_id` | `varchar(64)` | | Guest cart key |
| `items` | `jsonb` | NOT NULL | Cart items array |
| `subtotal` | `decimal(10,2)` | | |
| `applied_coupons` | `jsonb` | | |
| `updated_at` | `timestamptz` | DEFAULT NOW() | |
| `expires_at` | `timestamptz` | | Auto-cleanup |

> **Note:** Primary cart storage is Redis for performance. DB cart is sync'd periodically.

---

## 🔷 6. Review Tables

### reviews
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `product_id` | `uuid` | FK → products(id) ON DELETE CASCADE | |
| `customer_id` | `uuid` | FK → customers(id) | |
| `order_id` | `uuid` | FK → orders(id) | Verified purchase |
| `rating` | `smallint` | NOT NULL, CHECK 1-5 | |
| `title` | `varchar(100)` | | |
| `content` | `text` | NOT NULL | |
| `is_approved` | `boolean` | DEFAULT false | Moderation |
| `helpful_count` | `integer` | DEFAULT 0 | |
| `created_at` | `timestamptz` | DEFAULT NOW() | |

**Indexes:**
- `idx_reviews_product` ON (product_id)
- `idx_reviews_approved` ON (is_approved) WHERE is_approved = true

---

## 🔷 7. Wishlist Table

### wishlists
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `customer_id` | `uuid` | FK → customers(id) ON DELETE CASCADE | |
| `product_id` | `uuid` | FK → products(id) ON DELETE CASCADE | |
| `added_at` | `timestamptz` | DEFAULT NOW() | |
| | | PK (customer_id, product_id) | |

---

## 🔷 8. Coupon Tables

### coupons
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `code` | `varchar(50)` | UNIQUE, NOT NULL | SUMMER20 |
| `type` | `varchar(20)` | NOT NULL | percentage, fixed |
| `value` | `decimal(10,2)` | NOT NULL | |
| `min_order_amount` | `decimal(10,2)` | | |
| `max_uses` | `integer` | | |
| `used_count` | `integer` | DEFAULT 0 | |
| `starts_at` | `timestamptz` | | |
| `expires_at` | `timestamptz` | | |
| `is_active` | `boolean` | DEFAULT true | |

---

## 🔷 9. Configuration Tables

### tenant_config
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `key` | `varchar(100)` | PK | Config key |
| `value` | `jsonb` | NOT NULL | Config value |
| `updated_at` | `timestamptz` | DEFAULT NOW() | |

**Standard Keys:**
- `branding` → {logoUrl, faviconUrl, primaryColor, secondaryColor, fontFamily}
- `locale` → {defaultLanguage, currency, timezone, rtlEnabled}
- `social` → {instagram, twitter, facebook, whatsapp}
- `contact` → {email, phone, address, mapUrl}
- `legal` → {privacyPolicy, termsConditions, refundPolicy}

### menu_items
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `menu_type` | `varchar(20)` | NOT NULL | header, footer, mobile |
| `parent_id` | `uuid` | FK → menu_items(id) | Nested menus |
| `label` | `varchar(100)` | NOT NULL | Display text |
| `url` | `varchar(255)` | | Internal/external link |
| `icon` | `varchar(50)` | | Icon name |
| `order` | `integer` | DEFAULT 0 | |
| `is_active` | `boolean` | DEFAULT true | |

---

## 🔷 10. Content Tables

### pages
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `slug` | `varchar(255)` | UNIQUE, NOT NULL | |
| `title` | `varchar(255)` | NOT NULL | |
| `content` | `text` | | HTML/Markdown |
| `meta_title` | `varchar(60)` | | |
| `meta_description` | `varchar(160)` | | |
| `is_published` | `boolean` | DEFAULT false | |
| `created_at` | `timestamptz` | DEFAULT NOW() | |
| `updated_at` | `timestamptz` | DEFAULT NOW() | |

### blog_posts
| Column | Type | Constraints | Description |
|:-------|:-----|:------------|:------------|
| `id` | `uuid` | PK | |
| `slug` | `varchar(255)` | UNIQUE, NOT NULL | |
| `title` | `varchar(255)` | NOT NULL | |
| `excerpt` | `varchar(500)` | | |
| `content` | `text` | NOT NULL | |
| `featured_image` | `text` | | |
| `author_name` | `varchar(100)` | | |
| `is_published` | `boolean` | DEFAULT false | |
| `published_at` | `timestamptz` | | |
| `created_at` | `timestamptz` | DEFAULT NOW() | |

---

## ✅ Required Migrations

Every template MUST ship with Drizzle migrations for:

1. All tables above (minimum viable schema)
2. Required indexes for performance
3. Foreign key constraints for integrity
4. Check constraints for data validity

---

## 🔐 Security Requirements

| Requirement | Implementation |
|:------------|:---------------|
| S2: Tenant Isolation | All queries run within `tenant_{id}` schema context |
| S7: PII Encryption | `customers.email`, `customers.phone`, `customer_addresses.phone` encrypted at rest |
| S4: Audit Logging | All INSERT/UPDATE/DELETE operations logged to `public.audit_logs` |
| S3: Input Validation | All data validated via Zod before DB write |

---

*Document End | Schema Version: 1.0.0*
