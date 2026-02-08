# 🔌 API Contracts for Templates
*Backend Endpoints Templates Consume*

---

## 🎯 Purpose

Templates NEVER access the database directly. All data flows through these API endpoints. This document defines the **contract** between templates and the backend.

---

## 🔷 Base URL & Authentication

```typescript
// All requests include:
// - Base URL: from env.NEXT_PUBLIC_API_URL
// - Tenant context: extracted from subdomain/header
// - Auth token: httpOnly cookie (when authenticated)

const api = createAPIClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'X-Tenant-ID': tenantId,
  },
  credentials: 'include', // Sends cookies
});
```

---

## 🔷 1. Configuration Endpoints

### GET /api/storefront/config

Returns tenant configuration for template initialization.

**Response:**
```typescript
interface StorefrontConfigResponse {
  tenant: {
    id: string;
    subdomain: string;
    storeName: string;
  };
  branding: {
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  locale: {
    defaultLanguage: 'en' | 'ar' | 'fr';
    currency: string;
    timezone: string;
    rtlEnabled: boolean;
  };
  features: {
    wishlist: boolean;
    compareProducts: boolean;
    reviews: boolean;
    loyalty: boolean;
    b2b: boolean;
    affiliates: boolean;
    aiRecommendations: boolean;
  };
  social: {
    instagram: string | null;
    twitter: string | null;
    facebook: string | null;
    whatsapp: string | null;
  };
  contact: {
    email: string;
    phone: string | null;
    address: string | null;
  };
}
```

**Caching:** Redis, 5 min TTL, invalidated on admin update.

---

### GET /api/storefront/menu

Returns navigation menu structure.

**Response:**
```typescript
interface MenuResponse {
  header: MenuItem[];
  footer: MenuItem[];
  mobile: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  children?: MenuItem[];
}
```

---

## 🔷 2. Product Endpoints

### GET /api/storefront/products

List products with filtering/pagination.

**Query Parameters:**
| Param | Type | Description |
|:------|:-----|:------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (max: 50) |
| `category` | string | Category slug |
| `search` | string | Search query |
| `sort` | string | `price_asc`, `price_desc`, `newest`, `bestseller` |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `brand` | string | Brand filter |
| `inStock` | boolean | Only in-stock items |
| `attributes` | string | JSON-encoded attribute filters |

**Response:**
```typescript
interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    priceRange: { min: number; max: number };
    brands: string[];
    attributes: Record<string, string[]>;
  };
}
```

---

### GET /api/storefront/products/:slug

Get single product details.

**Response:**
```typescript
interface ProductDetailResponse {
  product: Product;
  relatedProducts: Product[];
  reviews: {
    items: Review[];
    average: number;
    count: number;
    distribution: Record<1|2|3|4|5, number>;
  };
}
```

---

### GET /api/storefront/products/featured

Get featured/homepage products.

**Response:**
```typescript
interface FeaturedProductsResponse {
  bestSellers: Product[];
  newArrivals: Product[];
  featured: Product[];
  deals: Product[];
}
```

---

## 🔷 3. Category Endpoints

### GET /api/storefront/categories

List all categories.

**Response:**
```typescript
interface CategoriesResponse {
  categories: Category[];
}
```

---

### GET /api/storefront/categories/:slug

Get category with products.

**Query Parameters:** Same as product list.

**Response:**
```typescript
interface CategoryDetailResponse {
  category: Category;
  products: Product[];
  pagination: Pagination;
  subcategories: Category[];
}
```

---

## 🔷 4. Cart Endpoints

### GET /api/storefront/cart

Get current cart (from session).

**Response:**
```typescript
interface CartResponse {
  cart: Cart;
}
```

---

### POST /api/storefront/cart/items

Add item to cart.

**Request Body:**
```typescript
interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}
```

**Response:** Updated `Cart` object.

---

### PATCH /api/storefront/cart/items/:itemId

Update cart item quantity.

**Request Body:**
```typescript
interface UpdateCartItemRequest {
  quantity: number;
}
```

---

### DELETE /api/storefront/cart/items/:itemId

Remove item from cart.

---

### POST /api/storefront/cart/coupon

Apply coupon code.

**Request Body:**
```typescript
interface ApplyCouponRequest {
  code: string;
}
```

**Response:**
```typescript
interface CouponResponse {
  valid: boolean;
  discount: number;
  message?: string;
}
```

---

## 🔷 5. Checkout Endpoints

### POST /api/storefront/checkout/calculate

Calculate checkout totals.

**Request Body:**
```typescript
interface CalculateCheckoutRequest {
  shippingAddressId?: string;
  shippingMethod?: string;
}
```

**Response:**
```typescript
interface CheckoutCalculation {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingMethods: ShippingMethod[];
}
```

---

### POST /api/storefront/checkout/complete

Complete checkout and create order.

**Request Body:**
```typescript
interface CompleteCheckoutRequest {
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod: string;
  paymentMethod: 'card' | 'cod' | 'wallet';
  paymentIntentId?: string; // For Stripe
  notes?: string;
}
```

**Response:**
```typescript
interface OrderCreatedResponse {
  order: Order;
  paymentRequired: boolean;
  paymentUrl?: string; // Redirect URL for external payment
}
```

---

### POST /api/storefront/checkout/stripe/intent

Create Stripe payment intent.

**Response:**
```typescript
interface PaymentIntentResponse {
  clientSecret: string;
}
```

---

## 🔷 6. Auth Endpoints

### POST /api/auth/login

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:**
```typescript
interface AuthResponse {
  user: Customer;
  // Token set via httpOnly cookie
}
```

---

### POST /api/auth/register

**Request Body:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptsMarketing?: boolean;
}
```

---

### POST /api/auth/logout

Clears auth cookie.

---

### GET /api/auth/me

Get current authenticated user.

---

### POST /api/auth/forgot-password

**Request Body:**
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

---

## 🔷 7. Account Endpoints

### GET /api/storefront/account/orders

List customer orders.

**Query Parameters:** `page`, `limit`, `status`

---

### GET /api/storefront/account/orders/:id

Get order details.

---

### GET /api/storefront/account/addresses

List saved addresses.

---

### POST /api/storefront/account/addresses

Create new address.

---

### PUT /api/storefront/account/addresses/:id

Update address.

---

### DELETE /api/storefront/account/addresses/:id

Delete address.

---

### GET /api/storefront/account/wishlist

Get wishlist items.

---

### POST /api/storefront/account/wishlist/:productId

Add to wishlist.

---

### DELETE /api/storefront/account/wishlist/:productId

Remove from wishlist.

---

## 🔷 8. Content Endpoints

### GET /api/storefront/pages/:slug

Get static page content (about, contact, legal).

**Response:**
```typescript
interface PageResponse {
  page: {
    title: string;
    content: string; // HTML/Markdown
    metaTitle?: string;
    metaDescription?: string;
  };
}
```

---

### GET /api/storefront/banners

Get homepage banners.

**Response:**
```typescript
interface BannersResponse {
  banners: {
    id: string;
    imageUrl: string;
    mobileImageUrl?: string;
    link?: string;
    title?: string;
    subtitle?: string;
  }[];
}
```

---

## 🔷 9. Search Endpoint

### GET /api/storefront/search

Instant search with autocomplete.

**Query Parameters:**
| Param | Type | Description |
|:------|:-----|:------------|
| `q` | string | Search query |
| `limit` | number | Max results (default: 5) |

**Response:**
```typescript
interface SearchResponse {
  products: Product[];
  categories: Category[];
  suggestions: string[];
}
```

---

## 🔷 10. Review Endpoints

### GET /api/storefront/products/:id/reviews

Get product reviews.

**Query Parameters:** `page`, `limit`, `sort`

---

### POST /api/storefront/products/:id/reviews

Submit review (authenticated).

**Request Body:**
```typescript
interface CreateReviewRequest {
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  content: string;
}
```

---

## 📊 Rate Limits

| Endpoint Pattern | Limit | Window |
|:-----------------|:------|:-------|
| `GET /api/storefront/*` | 1000 | 1 min |
| `POST /api/storefront/cart/*` | 30 | 1 min |
| `POST /api/storefront/checkout/*` | 10 | 1 min |
| `POST /api/auth/*` | 5 | 1 min |

**Response on limit exceeded:**
```typescript
// HTTP 429
{
  "error": "Too Many Requests",
  "retryAfter": 45 // seconds
}
// Headers: X-RateLimit-Remaining, X-RateLimit-Reset
```

---

## 🔐 Security Notes

| Rule | Implementation |
|:-----|:---------------|
| S2 Isolation | All endpoints filter by tenant context |
| S3 Validation | All inputs validated via Zod |
| S4 Audit | Write operations logged |
| S7 Encryption | PII encrypted at rest |

---

*Document End | API Contract Version: 1.0.0*
