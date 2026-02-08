# Fashion Boutique Template

Elegant e-commerce template for fashion and apparel stores built with Next.js 14 App Router.

## ✨ Features

### Pages (Standard Tier)
- ✅ Homepage with Hero, Featured Products, Categories
- ✅ Product Listing with Filters
- ✅ Product Detail Page (PDP) with Gallery
- ✅ Shopping Cart
- ✅ One-Page Checkout (Stripe Integration)
- ✅ Search with Instant Results
- ✅ User Authentication (Login, Register)
- ✅ Account Dashboard
- ✅ Order History & Details
- ✅ Wishlist
- ✅ Legal Pages (Privacy, Terms, Refund)

### Widgets
- ✅ Mega Menu Navigation
- ✅ Quick View Modal
- ✅ Smart Filters
- ✅ Newsletter Popup
- ✅ WhatsApp Float Button
- ✅ Cookie Consent

### Integrations
- ✅ Stripe Payments
- ✅ Cash on Delivery (COD)
- ✅ Google Analytics (Ready)

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- Bun (recommended) or npm/yarn

### Installation

```bash
# Install dependencies
bun install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
bun run dev

# Build for production
bun run build
bun run start
```

### Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TENANT_ID=your-tenant-id
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

## 🎨 Customization

### Theme Tokens

Customize colors in `tailwind.config.js`:

```js
colors: {
  primary: '#2563eb',    // Your brand color
  secondary: '#7c3aed',  // Accent color
}
```

### Fonts

Update fonts in `src/app/layout.tsx`:

```ts
import { YourFont } from 'next/font/google';
```

## 📁 Project Structure

```
fashion-boutique/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities & API client
│   ├── stores/           # Zustand state stores
│   └── styles/           # Global styles
├── public/               # Static assets
├── __tests__/            # Tests
└── template.config.json  # Template metadata
```

## 🧪 Testing

```bash
# Run unit tests
bun test

# Run with coverage
bun test:coverage

# Security validation
bun packages/template-security/src/cli.ts ./templates/fashion-boutique
```

## 📊 Performance

- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s

## 🔒 Security

- ✅ **S2:** Tenant Isolation (no hardcoded tenant IDs)
- ✅ **S3:** Input Validation (Zod schemas)
- ✅ **S7:** PII Encryption (no localStorage for sensitive data)

## 📚 Documentation

- [Template Anatomy](../../docs/template-system/05-template-anatomy.md)
- [API Contracts](../../docs/template-system/07-api-contracts.md)
- [Testing Requirements](../../docs/template-system/04-testing-requirements.md)

## 🤝 Contributing

This is a reference template. Fork and modify for your needs.

## 📄 License

MIT License - See LICENSE file

---

**Version:** 1.0.0  
**Author:** Apex Templates  
**Category:** Fashion & Apparel
