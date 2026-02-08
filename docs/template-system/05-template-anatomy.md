# 🏗️ Template Anatomy & Installation
*File Structure, Naming Conventions, and Plug-and-Play Protocol*

---

## 🎯 Purpose

This document defines the **exact file structure** every template MUST follow for seamless installation into the Apex v2 platform.

---

## 📁 Template Directory Structure

```
templates/
└── {template-name}/                    # e.g., "fashion-boutique"
    ├── template.config.json            # ⭐ REQUIRED: Template metadata
    ├── README.md                       # Template documentation
    ├── preview.png                     # Preview image (1200x630px)
    ├── screenshots/                    # Gallery images
    │   ├── home.png
    │   ├── product.png
    │   └── checkout.png
    │
    ├── src/
    │   ├── app/                        # Next.js App Router pages
    │   │   ├── layout.tsx              # Root layout with providers
    │   │   ├── page.tsx                # Home page
    │   │   ├── (shop)/
    │   │   │   ├── products/
    │   │   │   │   ├── page.tsx        # Product listing
    │   │   │   │   └── [slug]/
    │   │   │   │       └── page.tsx    # Product details (PDP)
    │   │   │   ├── categories/
    │   │   │   │   └── [slug]/
    │   │   │   │       └── page.tsx    # Category page
    │   │   │   ├── cart/
    │   │   │   │   └── page.tsx        # Shopping cart
    │   │   │   ├── checkout/
    │   │   │   │   └── page.tsx        # One-page checkout
    │   │   │   └── search/
    │   │   │       └── page.tsx        # Search results
    │   │   │
    │   │   ├── (account)/
    │   │   │   ├── login/
    │   │   │   │   └── page.tsx
    │   │   │   ├── register/
    │   │   │   │   └── page.tsx
    │   │   │   ├── dashboard/
    │   │   │   │   └── page.tsx        # My Account
    │   │   │   ├── orders/
    │   │   │   │   ├── page.tsx        # Order list
    │   │   │   │   └── [id]/
    │   │   │   │       └── page.tsx    # Order details
    │   │   │   ├── wishlist/
    │   │   │   │   └── page.tsx
    │   │   │   └── addresses/
    │   │   │       └── page.tsx
    │   │   │
    │   │   ├── (content)/
    │   │   │   ├── about/
    │   │   │   │   └── page.tsx
    │   │   │   ├── contact/
    │   │   │   │   └── page.tsx
    │   │   │   ├── faq/
    │   │   │   │   └── page.tsx
    │   │   │   └── [slug]/
    │   │   │       └── page.tsx        # Dynamic content pages
    │   │   │
    │   │   ├── (legal)/
    │   │   │   ├── privacy/
    │   │   │   │   └── page.tsx
    │   │   │   ├── terms/
    │   │   │   │   └── page.tsx
    │   │   │   └── refund/
    │   │   │       └── page.tsx
    │   │   │
    │   │   ├── track-order/
    │   │   │   └── page.tsx            # Guest order tracking
    │   │   ├── not-found.tsx           # 404 page
    │   │   ├── error.tsx               # Error boundary
    │   │   └── health/
    │   │       └── route.ts            # Health check endpoint
    │   │
    │   ├── components/                 # Reusable UI components
    │   │   ├── layout/
    │   │   │   ├── Header/
    │   │   │   │   ├── Header.tsx
    │   │   │   │   ├── Header.test.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── Footer/
    │   │   │   ├── MegaMenu/
    │   │   │   └── MobileNav/
    │   │   │
    │   │   ├── product/
    │   │   │   ├── ProductCard/
    │   │   │   ├── ProductGallery/
    │   │   │   ├── ProductVariants/
    │   │   │   ├── QuickView/
    │   │   │   └── AddToCartButton/
    │   │   │
    │   │   ├── cart/
    │   │   │   ├── CartDrawer/
    │   │   │   ├── CartItem/
    │   │   │   └── CartSummary/
    │   │   │
    │   │   ├── checkout/
    │   │   │   ├── CheckoutForm/
    │   │   │   ├── ShippingOptions/
    │   │   │   └── PaymentForm/
    │   │   │
    │   │   ├── search/
    │   │   │   ├── SearchBar/
    │   │   │   ├── SearchResults/
    │   │   │   └── SmartFilters/
    │   │   │
    │   │   ├── common/
    │   │   │   ├── Button/
    │   │   │   ├── Input/
    │   │   │   ├── Modal/
    │   │   │   ├── Toast/
    │   │   │   └── Skeleton/
    │   │   │
    │   │   └── widgets/
    │   │       ├── NewsletterPopup/
    │   │       ├── CookieConsent/
    │   │       ├── WhatsAppFloat/
    │   │       └── OutOfStockNotify/
    │   │
    │   ├── hooks/                      # Custom React hooks
    │   │   ├── useProducts.ts
    │   │   ├── useCart.ts
    │   │   ├── useAuth.ts
    │   │   └── useTenant.ts
    │   │
    │   ├── stores/                     # Zustand stores
    │   │   ├── cart.store.ts
    │   │   ├── auth.store.ts
    │   │   └── ui.store.ts
    │   │
    │   ├── lib/                        # Utility functions
    │   │   ├── api.ts                  # API client wrapper
    │   │   ├── formatters.ts           # Price, date formatters
    │   │   └── validators.ts           # Client-side validation
    │   │
    │   └── styles/                     # Template-specific styles
    │       ├── globals.css
    │       ├── variables.css           # CSS custom properties
    │       └── components/             # Component-specific styles
    │
    ├── public/
    │   ├── fonts/                      # Custom fonts
    │   └── icons/                      # SVG icons
    │
    ├── __tests__/                      # Test files
    │   ├── integration/
    │   └── e2e/
    │
    ├── package.json                    # Template dependencies
    ├── tsconfig.json                   # TypeScript config
    └── tailwind.config.js              # Tailwind config (extends @apex/ui)
```

---

## 📄 template.config.json

Every template MUST include this metadata file:

```json
{
  "$schema": "https://apex.io/schemas/template.json",
  "name": "fashion-boutique",
  "displayName": "Fashion Boutique",
  "version": "1.0.0",
  "description": "Elegant template for fashion and apparel stores",
  "category": "fashion",
  "tags": ["fashion", "apparel", "clothing", "modern", "minimal"],
  "author": {
    "name": "Apex Templates",
    "email": "templates@apex.io"
  },
  
  "preview": {
    "image": "./preview.png",
    "demoUrl": "https://demo.apex.io/fashion-boutique"
  },
  
  "features": {
    "pages": {
      "home": true,
      "productListing": true,
      "productDetails": true,
      "cart": true,
      "checkout": true,
      "account": true,
      "orders": true,
      "wishlist": true,
      "search": true,
      "blog": false,
      "compare": false
    },
    "widgets": {
      "megaMenu": true,
      "quickView": true,
      "newsletterPopup": true,
      "cookieConsent": true,
      "whatsappFloat": true,
      "smartFilters": true
    },
    "integrations": {
      "stripe": true,
      "codPayment": true,
      "googleAnalytics": true,
      "facebookPixel": true
    }
  },
  
  "requirements": {
    "apexVersion": ">=2.0.0",
    "node": ">=20.0.0",
    "packages": {
      "@apex/ui": "workspace:*",
      "@apex/auth": "workspace:*",
      "@apex/validators": "workspace:*"
    }
  },
  
  "locales": ["en", "ar"],
  "rtlSupport": true,
  
  "customization": {
    "fonts": ["Inter", "Poppins", "Cairo"],
    "colorSchemes": ["light", "dark"],
    "layouts": ["wide", "boxed"]
  }
}
```

---

## 🔌 Installation Protocol

### Step 1: Template Registration

```bash
# CLI command to install template
bun run template:install fashion-boutique

# What happens:
# 1. Downloads template from registry
# 2. Copies to apps/storefront/templates/{name}/
# 3. Registers in database (templates table)
# 4. Rebuilds storefront with new template
```

### Step 2: Tenant Template Assignment

```typescript
// Super Admin assigns template to tenant
await assignTemplate({
  tenantId: 'tenant-alpha',
  templateName: 'fashion-boutique',
  customization: {
    primaryColor: '#2563eb',
    fontFamily: 'Inter',
    layout: 'wide'
  }
});

// What happens:
// 1. Updates tenant_config table
// 2. Invalidates Redis cache
// 3. Next request loads new template
```

### Step 3: Dynamic Template Loading

```typescript
// apps/storefront/src/app/layout.tsx

export default async function RootLayout({ children }) {
  const tenant = await getTenant();
  const TemplateLayout = await importTemplate(tenant.templateName);
  
  return (
    <TenantProvider config={tenant.config}>
      <TemplateLayout>
        {children}
      </TemplateLayout>
    </TenantProvider>
  );
}

// Dynamic import based on tenant config
async function importTemplate(templateName: string) {
  const templates = {
    'fashion-boutique': () => import('@templates/fashion-boutique/layout'),
    'tech-store': () => import('@templates/tech-store/layout'),
    'grocery-fresh': () => import('@templates/grocery-fresh/layout'),
  };
  
  const loader = templates[templateName] || templates['default'];
  return (await loader()).default;
}
```

---

## 📝 Naming Conventions

| Element | Convention | Example |
|:--------|:-----------|:--------|
| Template folder | `kebab-case` | `fashion-boutique` |
| Components | `PascalCase` | `ProductCard.tsx` |
| Hooks | `camelCase` with `use` prefix | `useCart.ts` |
| Stores | `camelCase` with `.store` suffix | `cart.store.ts` |
| Pages | `page.tsx` in folder | `products/[slug]/page.tsx` |
| Tests | `.test.tsx` or `.spec.ts` | `ProductCard.test.tsx` |
| CSS files | `kebab-case` | `product-card.css` |

---

## 🔒 Template Isolation Rules

| Rule | Description |
|:-----|:------------|
| No direct imports from other templates | Templates are self-contained |
| Use `@apex/*` packages only | No direct package imports |
| No hardcoded tenant data | All config from TenantProvider |
| No side effects on install | Template is pure code until activated |

---

## ✅ Pre-Installation Checklist

- [ ] `template.config.json` valid against schema
- [ ] All required pages present
- [ ] All components have tests
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Builds successfully in isolation
- [ ] Preview image provided
- [ ] README.md documented

---

*Document End | Template Anatomy Version: 1.0.0*
