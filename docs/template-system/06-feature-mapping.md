# 📋 Feature Mapping to Template Slots
*Mapping 45+ Storefront Features to Template Components*

---

## 🎯 Purpose

This document maps every feature from [store-features-masterlist.md](../store-features-masterlist.md) to its corresponding **template slot** (page, component, or widget).

---

## 🔷 1. Core Shopping Pages (Money Makers)

| # | Feature | Template Slot | Required | Component Location |
|:--|:--------|:--------------|:---------|:--------------------|
| 01 | **Home Page** | `app/page.tsx` | ✅ REQUIRED | `components/home/` |
| 02 | **Search & Results** | `app/search/page.tsx` | ✅ REQUIRED | `components/search/` |
| 03 | **Product Details (PDP)** | `app/products/[slug]/page.tsx` | ✅ REQUIRED | `components/product/` |
| 04 | **Quick View** | Modal Component | ✅ REQUIRED | `components/product/QuickView/` |
| 05 | **Shopping Cart** | `app/cart/page.tsx` | ✅ REQUIRED | `components/cart/` |
| 06 | **Checkout (One-Page)** | `app/checkout/page.tsx` | ✅ REQUIRED | `components/checkout/` |
| 07 | **Order Success** | `app/checkout/success/page.tsx` | ✅ REQUIRED | `components/checkout/OrderSuccess/` |
| 08 | **Payment Failure** | `app/checkout/failed/page.tsx` | ✅ REQUIRED | `components/checkout/PaymentFailed/` |
| 09 | **Category/Collection** | `app/categories/[slug]/page.tsx` | 🟡 HIGH | `components/category/` |
| 10 | **Flash Deals / Offers** | `app/deals/page.tsx` | 🟢 MEDIUM | `components/deals/` |
| 11 | **Compare Products** | `app/compare/page.tsx` | 🟢 MEDIUM | `components/compare/` |
| 12 | **Store Locations** | `app/locations/page.tsx` | 🟢 MEDIUM | `components/locations/` |

### Home Page Slot Definition

```typescript
// templates/{name}/src/app/page.tsx

interface HomePageSlots {
  // Required sections
  hero: React.FC<{ banners: Banner[] }>;
  featuredProducts: React.FC<{ products: Product[] }>;
  categories: React.FC<{ categories: Category[] }>;
  
  // Optional sections
  flashDeals?: React.FC<{ deals: Deal[] }>;
  bestSellers?: React.FC<{ products: Product[] }>;
  socialWall?: React.FC<{ posts: InstagramPost[] }>;
  newsletter?: React.FC;
}
```

---

## 🔷 2. User Account Pages

| # | Feature | Template Slot | Required | Component Location |
|:--|:--------|:--------------|:---------|:--------------------|
| 13 | **Login** | `app/login/page.tsx` or Modal | ✅ REQUIRED | `components/auth/LoginForm/` |
| 14 | **Register** | `app/register/page.tsx` | 🟡 HIGH | `components/auth/RegisterForm/` |
| 15 | **My Account Dashboard** | `app/account/page.tsx` | 🟡 HIGH | `components/account/Dashboard/` |
| 16 | **My Orders** | `app/account/orders/page.tsx` | 🟡 HIGH | `components/account/OrderList/` |
| 17 | **Order Details** | `app/account/orders/[id]/page.tsx` | 🟡 HIGH | `components/account/OrderDetails/` |
| 18 | **Track Order (Guest)** | `app/track-order/page.tsx` | 🟡 HIGH | `components/order/TrackOrder/` |
| 19 | **Addresses** | `app/account/addresses/page.tsx` | 🟡 MEDIUM | `components/account/AddressList/` |
| 20 | **Payment Methods** | `app/account/payments/page.tsx` | 🟡 MEDIUM | `components/account/PaymentMethods/` |
| 21 | **Wishlist / Favorites** | `app/account/wishlist/page.tsx` | 🟡 MEDIUM | `components/account/Wishlist/` |
| 22 | **Wallet / Credits** | `app/account/wallet/page.tsx` | 🟢 MEDIUM | `components/account/Wallet/` |
| 23 | **Loyalty Points** | `app/account/loyalty/page.tsx` | 🟢 LOW | `components/account/Loyalty/` |
| 24 | **Referral / Invite** | `app/account/referral/page.tsx` | 🟢 LOW | `components/account/Referral/` |
| 25 | **Product Reviews** | `app/account/reviews/page.tsx` | 🟢 LOW | `components/account/MyReviews/` |
| 26 | **Return Request (RMA)** | `app/account/returns/page.tsx` | 🟡 MEDIUM | `components/account/ReturnRequest/` |
| 27 | **Notifications** | `app/account/notifications/page.tsx` | 🟢 LOW | `components/account/Notifications/` |

---

## 🔷 3. Content, Legal & Support Pages

| # | Feature | Template Slot | Required | Component Location |
|:--|:--------|:--------------|:---------|:--------------------|
| 28 | **Privacy Policy** | `app/privacy/page.tsx` | ✅ REQUIRED | `components/legal/LegalPage/` |
| 29 | **Terms & Conditions** | `app/terms/page.tsx` | ✅ REQUIRED | `components/legal/LegalPage/` |
| 30 | **Refund Policy** | `app/refund/page.tsx` | ✅ REQUIRED | `components/legal/LegalPage/` |
| 31 | **About Us** | `app/about/page.tsx` | 🟡 MEDIUM | `components/content/AboutPage/` |
| 32 | **Contact Us** | `app/contact/page.tsx` | 🟡 MEDIUM | `components/content/ContactPage/` |
| 33 | **FAQ** | `app/faq/page.tsx` | 🟡 MEDIUM | `components/content/FAQPage/` |
| 34 | **Blog / Articles** | `app/blog/page.tsx` | 🟢 LOW | `components/blog/` |
| 35 | **404 Not Found** | `app/not-found.tsx` | ✅ REQUIRED | `components/error/NotFound/` |
| 36 | **Maintenance Mode** | Middleware + Page | 🟢 LOW | `components/error/Maintenance/` |

---

## 🔷 4. Functional Widgets (Everywhere Components)

| # | Feature | Template Slot | Required | Component Location |
|:--|:--------|:--------------|:---------|:--------------------|
| 37 | **Global Search (Ajax)** | Header Component | ✅ REQUIRED | `components/search/SearchBar/` |
| 38 | **Mega Menu** | Header Component | ✅ REQUIRED | `components/layout/MegaMenu/` |
| 39 | **Smart Filters** | Category/Search Pages | ✅ REQUIRED | `components/search/SmartFilters/` |
| 40 | **Toast Notifications** | Root Layout | 🟢 MEDIUM | `components/common/Toast/` |
| 41 | **Newsletter Popup** | Root Layout | 🟢 LOW | `components/widgets/NewsletterPopup/` |
| 42 | **Floating WhatsApp** | Root Layout | 🟢 LOW | `components/widgets/WhatsAppFloat/` |
| 43 | **Social Wall** | Home Page Section | 🟢 LOW | `components/widgets/SocialWall/` |
| 44 | **Out of Stock Notify** | PDP Component | 🟢 MEDIUM | `components/widgets/OutOfStockNotify/` |
| 45 | **Cookie Consent** | Root Layout | ✅ REQUIRED | `components/widgets/CookieConsent/` |

---

## 🔷 5. Advanced Features (Optional Slots)

| Feature | Template Slot | Gated By | Component Location |
|:--------|:--------------|:---------|:--------------------|
| **AI Personalization Hub** | `app/for-you/page.tsx` | `features.aiRecommendations` | `components/ai/ForYou/` |
| **Buy Now, Pay Later** | Checkout Component | `features.bnpl` | `components/checkout/BNPLOptions/` |
| **Interactive Size Guide** | PDP Component | `features.sizeGuide` | `components/product/SizeGuide/` |
| **Help Center (KB)** | `app/help/page.tsx` | `features.helpCenter` | `components/support/HelpCenter/` |
| **Gift Hub** | `app/gifts/page.tsx` | `features.giftCards` | `components/gifts/` |
| **Order Timeline Story** | Order Details | `features.orderTimeline` | `components/order/Timeline/` |

---

## 📐 Slot Contract Interface

Every slot MUST implement this interface:

```typescript
// types/slots.ts

export interface SlotProps<T = unknown> {
  data: T;
  config: TenantConfig;
  locale: 'en' | 'ar';
}

// Example: Product Card Slot
export interface ProductCardSlotProps extends SlotProps<Product> {
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onQuickView: (product: Product) => void;
  onWishlistToggle: (product: Product) => void;
  showQuickView?: boolean;
  showWishlist?: boolean;
}

// Template implements:
export function ProductCard({
  data: product,
  config,
  locale,
  onAddToCart,
  onQuickView,
  onWishlistToggle,
  showQuickView = true,
  showWishlist = true,
}: ProductCardSlotProps) {
  // Implementation
}
```

---

## 🎨 Theme Token Slots

Templates receive design tokens from tenant config:

```typescript
interface ThemeTokens {
  // Colors
  colors: {
    primary: string;      // #2563eb
    secondary: string;    // #7c3aed
    accent: string;       // #f59e0b
    background: string;   // #ffffff
    foreground: string;   // #111827
    muted: string;        // #6b7280
    success: string;      // #10b981
    warning: string;      // #f59e0b
    error: string;        // #ef4444
  };
  
  // Typography
  typography: {
    fontFamily: string;   // 'Inter', 'Cairo'
    headingFamily?: string;
    baseFontSize: number; // 16
    scale: number;        // 1.25 (major third)
  };
  
  // Spacing
  spacing: {
    base: number;         // 4 (px)
    containerMaxWidth: string; // '1280px'
    headerHeight: string; // '64px'
  };
  
  // Borders
  borders: {
    radius: string;       // '8px'
    width: string;        // '1px'
  };
}
```

---

## ✅ Feature Completeness Matrix

Template categories define minimum feature sets:

| Category | Minimum Required Features |
|:---------|:--------------------------|
| **Basic** | Pages: 01-08, 13, 28-30, 35 / Widgets: 37-39, 45 |
| **Standard** | Basic + 09, 14-21, 31-33, 40-41 |
| **Advanced** | Standard + 10-11, 22-27, 42-44, All Advanced |

---

*Document End | Feature Mapping Version: 1.0.0*
