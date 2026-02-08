# 📜 Template Data Contracts
*TypeScript Interfaces & Zod Schemas | S3 Validation Enforcement*

---

## 🎯 Purpose

Templates are **consumers** of data. They NEVER fetch data directly. All data flows through these contracts.

---

## 🔷 1. Tenant Configuration Contract

Every template receives tenant branding/config at render time.

```typescript
// @apex/validators/src/storefront/tenant-config.schema.ts

import { z } from 'zod';

export const TenantConfigSchema = z.object({
  tenantId: z.string().uuid(),
  subdomain: z.string().min(3).max(63),
  storeName: z.string().min(1).max(100),
  
  // Branding
  logoUrl: z.string().url().nullable(),
  faviconUrl: z.string().url().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fontFamily: z.enum(['Inter', 'Roboto', 'Poppins', 'Cairo', 'Tajawal']),
  
  // Locale
  defaultLanguage: z.enum(['en', 'ar', 'fr']),
  currency: z.string().length(3), // ISO 4217
  timezone: z.string(),
  rtlEnabled: z.boolean(),
  
  // Features (from Feature Flags)
  features: z.object({
    wishlist: z.boolean(),
    compareProducts: z.boolean(),
    reviews: z.boolean(),
    loyalty: z.boolean(),
    b2b: z.boolean(),
    affiliates: z.boolean(),
    aiRecommendations: z.boolean(),
  }),
  
  // Social
  socialLinks: z.object({
    instagram: z.string().url().nullable(),
    twitter: z.string().url().nullable(),
    facebook: z.string().url().nullable(),
    whatsapp: z.string().nullable(),
  }),
  
  // Contact
  contactEmail: z.string().email(),
  contactPhone: z.string().nullable(),
  address: z.string().nullable(),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;
```

---

## 🔷 2. Product Contract

Standard product shape for all templates.

```typescript
// @apex/validators/src/storefront/product.schema.ts

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(), // e.g., "Red / XL"
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable(),
  quantity: z.number().int().min(0),
  attributes: z.record(z.string()), // { color: "Red", size: "XL" }
  imageUrl: z.string().url().nullable(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  shortDescription: z.string().max(500).nullable(),
  
  // Pricing (default variant)
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable(),
  currency: z.string().length(3),
  
  // Media
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().nullable(),
    isPrimary: z.boolean(),
  })),
  
  // Categorization
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  categorySlug: z.string(),
  tags: z.array(z.string()),
  brand: z.string().nullable(),
  
  // Variants
  variants: z.array(ProductVariantSchema),
  hasVariants: z.boolean(),
  
  // Inventory
  inStock: z.boolean(),
  quantity: z.number().int().min(0),
  
  // SEO
  metaTitle: z.string().max(60).nullable(),
  metaDescription: z.string().max(160).nullable(),
  
  // Reviews Summary
  averageRating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  
  // Timestamps
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
```

---

## 🔷 3. Cart Contract

Shopping cart state shape.

```typescript
// @apex/validators/src/storefront/cart.schema.ts

export const CartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  name: z.string(),
  sku: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().url().nullable(),
  attributes: z.record(z.string()).optional(),
});

export const CartSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid().nullable(), // null for guest
  
  items: z.array(CartItemSchema),
  
  // Totals
  subtotal: z.number().min(0),
  discount: z.number().min(0),
  shipping: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  
  // Coupons
  appliedCoupons: z.array(z.object({
    code: z.string(),
    discountAmount: z.number(),
    discountType: z.enum(['percentage', 'fixed']),
  })),
  
  currency: z.string().length(3),
  itemCount: z.number().int().min(0),
  
  updatedAt: z.string().datetime(),
});

export type Cart = z.infer<typeof CartSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
```

---

## 🔷 4. Order Contract

Order shape for account pages.

```typescript
// @apex/validators/src/storefront/order.schema.ts

export const OrderStatusSchema = z.enum([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(), // Human-readable: "ORD-2026-001234"
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  
  status: OrderStatusSchema,
  
  items: z.array(z.object({
    productId: z.string().uuid(),
    name: z.string(),
    sku: z.string(),
    price: z.number(),
    quantity: z.number().int(),
    imageUrl: z.string().url().nullable(),
  })),
  
  // Totals
  subtotal: z.number(),
  discount: z.number(),
  shipping: z.number(),
  tax: z.number(),
  total: z.number(),
  currency: z.string().length(3),
  
  // Addresses
  shippingAddress: z.object({
    name: z.string(),
    line1: z.string(),
    line2: z.string().nullable(),
    city: z.string(),
    state: z.string().nullable(),
    postalCode: z.string(),
    country: z.string().length(2), // ISO 3166-1 alpha-2
    phone: z.string().nullable(),
  }),
  
  billingAddress: z.object({
    name: z.string(),
    line1: z.string(),
    line2: z.string().nullable(),
    city: z.string(),
    state: z.string().nullable(),
    postalCode: z.string(),
    country: z.string().length(2),
  }),
  
  // Payment
  paymentMethod: z.enum(['card', 'cod', 'wallet', 'bnpl']),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  
  // Tracking
  trackingNumber: z.string().nullable(),
  trackingUrl: z.string().url().nullable(),
  
  // Timestamps
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  shippedAt: z.string().datetime().nullable(),
  deliveredAt: z.string().datetime().nullable(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
```

---

## 🔷 5. Category Contract

```typescript
// @apex/validators/src/storefront/category.schema.ts

export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  parentId: z.string().uuid().nullable(),
  productCount: z.number().int().min(0),
  order: z.number().int(),
});

export type Category = z.infer<typeof CategorySchema>;
```

---

## 🔷 6. Review Contract

```typescript
// @apex/validators/src/storefront/review.schema.ts

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string(), // Display name
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).nullable(),
  content: z.string().max(2000),
  verified: z.boolean(), // Verified purchase
  helpful: z.number().int().min(0),
  createdAt: z.string().datetime(),
});

export type Review = z.infer<typeof ReviewSchema>;
```

---

## 🔷 7. User/Customer Contract

```typescript
// @apex/validators/src/storefront/customer.schema.ts

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  
  // Loyalty
  loyaltyPoints: z.number().int().min(0),
  walletBalance: z.number().min(0),
  
  // Stats
  orderCount: z.number().int().min(0),
  totalSpent: z.number().min(0),
  
  createdAt: z.string().datetime(),
});

export type Customer = z.infer<typeof CustomerSchema>;
```

---

## ✅ Validation Rules

| Rule | Enforcement |
|:-----|:------------|
| All API responses MUST pass Zod validation before reaching templates | S3 Protocol |
| Templates receive `unknown` data → validate with schema → typed output | Type safety |
| Validation errors trigger 500 + GlitchTip alert (not user-facing) | S5 Protocol |

---

## 🚫 Anti-Patterns

```typescript
// ❌ NEVER: Direct API call in template
const products = await fetch('/api/products'); // FORBIDDEN

// ✅ CORRECT: Data passed as props
export function ProductGrid({ products }: { products: Product[] }) {
  return products.map(p => <ProductCard product={p} />);
}
```

---

*Document End | Contract Version: 1.0.0*
