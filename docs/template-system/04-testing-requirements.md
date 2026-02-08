# 🧪 Template Testing Requirements
*Mandatory Test Coverage for Storefront Templates*

---

## 🎯 Purpose

Every storefront template MUST pass a comprehensive test suite before being accepted into the template registry. This document defines **mandatory tests** and **coverage requirements**.

---

## 📊 Coverage Gates

| Gate | Minimum | Target | Enforcement |
|:-----|:--------|:-------|:------------|
| **Unit Tests** | 80% | 95% | CI Pipeline fails below minimum |
| **Component Tests** | 75% | 90% | Visual regression detection |
| **Integration Tests** | 60% | 80% | API contract validation |
| **E2E Tests** | Critical paths only | | Playwright/Cypress |
| **Accessibility** | WCAG 2.1 AA | | Automated axe checks |

---

## 🔷 1. Required Unit Tests

### 1.1 Data Transformation Tests

```typescript
// Every data transformer function must be tested
describe('Product Transformers', () => {
  it('should calculate discountPercentage correctly', () => {
    const product = { price: 80, compareAtPrice: 100 };
    expect(calculateDiscount(product)).toBe(20);
  });

  it('should handle null compareAtPrice', () => {
    const product = { price: 80, compareAtPrice: null };
    expect(calculateDiscount(product)).toBe(0);
  });

  it('should format currency according to locale', () => {
    expect(formatPrice(1234.5, 'USD', 'en-US')).toBe('$1,234.50');
    expect(formatPrice(1234.5, 'SAR', 'ar-SA')).toBe('١٬٢٣٤٫٥٠ ر.س');
  });
});
```

### 1.2 Validation Tests

```typescript
// Every Zod schema must have edge case tests
describe('Checkout Form Validation', () => {
  it('should reject invalid email format', () => {
    const result = CheckoutFormSchema.safeParse({ email: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject expired card', () => {
    const result = PaymentSchema.safeParse({ 
      cardExpiry: '01/20' // Expired
    });
    expect(result.success).toBe(false);
  });

  it('should strip unknown properties', () => {
    const result = CustomerSchema.safeParse({ 
      email: 'test@test.com',
      malicious: '<script>' 
    });
    expect(result.data).not.toHaveProperty('malicious');
  });
});
```

### 1.3 State Management Tests

```typescript
// Zustand store logic must be tested
describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should add item to empty cart', () => {
    useCartStore.getState().addItem(mockProduct);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('should increment quantity for existing item', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it('should calculate totals correctly', () => {
    useCartStore.getState().addItem({ ...mockProduct, price: 100, quantity: 2 });
    expect(useCartStore.getState().subtotal).toBe(200);
  });

  it('should apply percentage coupon', () => {
    useCartStore.getState().addItem({ ...mockProduct, price: 100 });
    useCartStore.getState().applyCoupon({ type: 'percentage', value: 10 });
    expect(useCartStore.getState().discount).toBe(10);
  });
});
```

---

## 🔷 2. Required Component Tests

### 2.1 Render Tests

```typescript
// Every component must test basic rendering
describe('ProductCard', () => {
  it('should render product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });

  it('should show "Out of Stock" badge when quantity is 0', () => {
    render(<ProductCard product={{ ...mockProduct, quantity: 0 }} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should show discount badge when compareAtPrice exists', () => {
    render(<ProductCard product={{ ...mockProduct, compareAtPrice: 100, price: 80 }} />);
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });
});
```

### 2.2 Interaction Tests

```typescript
describe('AddToCartButton', () => {
  it('should call addToCart on click', async () => {
    const addToCart = vi.fn();
    render(<AddToCartButton product={mockProduct} onAddToCart={addToCart} />);
    
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    
    expect(addToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('should be disabled when out of stock', () => {
    render(<AddToCartButton product={{ ...mockProduct, inStock: false }} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading state during API call', async () => {
    render(<AddToCartButton product={mockProduct} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

### 2.3 Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('ProductCard should have no a11y violations', async () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Checkout form should have proper labels', () => {
    render(<CheckoutForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    render(<ProductGrid products={mockProducts} />);
    
    await userEvent.tab();
    expect(screen.getByTestId('product-0')).toHaveFocus();
    
    await userEvent.tab();
    expect(screen.getByTestId('product-1')).toHaveFocus();
  });
});
```

---

## 🔷 3. Required Integration Tests

### 3.1 API Contract Tests

```typescript
// Verify template works with actual API responses
describe('API Integration', () => {
  beforeEach(() => {
    server.use(
      rest.get('/api/products', (req, res, ctx) => {
        return res(ctx.json(mockProductsResponse));
      })
    );
  });

  it('should render products from API', async () => {
    render(<ProductListPage />);
    
    await waitFor(() => {
      expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/products', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<ProductListPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/unable to load products/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during fetch', () => {
    render(<ProductListPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

### 3.2 S2 Isolation Tests

```typescript
describe('S2: Tenant Isolation', () => {
  it('should only fetch products for current tenant', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    
    render(<ProductListPage tenantId="tenant-a" />);
    
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('tenant-a'),
        expect.any(Object)
      );
    });
  });

  it('should NOT render data from other tenants', async () => {
    // Mock API returns data from wrong tenant
    server.use(
      rest.get('/api/products', (req, res, ctx) => {
        return res(ctx.json({ 
          products: [{ ...mockProduct, tenantId: 'tenant-b' }] 
        }));
      })
    );

    render(<ProductListPage tenantId="tenant-a" />);
    
    await waitFor(() => {
      expect(screen.queryByText(mockProduct.name)).not.toBeInTheDocument();
    });
  });
});
```

---

## 🔷 4. Required E2E Tests

### 4.1 Critical Path Tests (Mandatory)

```typescript
// Playwright E2E tests
describe('Critical Paths', () => {
  test('Complete checkout flow', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Welcome');
    
    // 2. Search for product
    await page.fill('[data-testid="search-input"]', 'shirt');
    await page.click('[data-testid="search-button"]');
    
    // 3. View product details
    await page.click('[data-testid="product-card-0"]');
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    
    // 4. Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    
    // 5. Proceed to checkout
    await page.click('[data-testid="view-cart"]');
    await page.click('[data-testid="checkout-button"]');
    
    // 6. Fill checkout form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'User');
    await page.fill('[name="address"]', '123 Test St');
    
    // 7. Complete payment (Stripe test mode)
    await page.click('[data-testid="pay-button"]');
    
    // 8. Verify success page
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
  });

  test('User registration and login', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="account-dashboard"]')).toBeVisible();
  });

  test('Guest order tracking', async ({ page }) => {
    await page.goto('/track-order');
    await page.fill('[name="orderNumber"]', 'ORD-2026-001234');
    await page.fill('[name="email"]', 'guest@example.com');
    await page.click('[data-testid="track-button"]');
    
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
  });
});
```

---

## 🔷 5. Visual Regression Tests

```typescript
// Chromatic or Percy integration
describe('Visual Regression', () => {
  it('Homepage matches snapshot', async () => {
    const { takeScreenshot } = require('your-visual-testing-tool');
    
    await page.goto('/');
    await expect(await takeScreenshot()).toMatchSnapshot();
  });

  it('Product card matches design', async () => {
    render(<ProductCard product={mockProduct} />);
    
    const card = screen.getByTestId('product-card');
    expect(await snapshot(card)).toMatchBaseline('product-card');
  });
});
```

---

## 🔷 6. RTL (Right-to-Left) Tests

```typescript
describe('RTL Support', () => {
  beforeEach(() => {
    document.dir = 'rtl';
  });

  it('should mirror layout for Arabic locale', () => {
    render(<ProductGrid products={mockProducts} locale="ar" />);
    
    const grid = screen.getByTestId('product-grid');
    expect(getComputedStyle(grid).direction).toBe('rtl');
  });

  it('should format prices in Arabic numerals', () => {
    render(<Price amount={1234.50} currency="SAR" locale="ar-SA" />);
    
    expect(screen.getByText('١٬٢٣٤٫٥٠ ر.س')).toBeInTheDocument();
  });
});
```

---

## 📋 Test File Naming Convention

```
template-name/
├── components/
│   ├── ProductCard/
│   │   ├── ProductCard.tsx
│   │   ├── ProductCard.test.tsx      # Unit tests
│   │   └── ProductCard.stories.tsx   # Storybook
│   └── ...
├── __tests__/
│   ├── integration/
│   │   ├── checkout.test.ts
│   │   └── api-contracts.test.ts
│   └── e2e/
│       ├── checkout.spec.ts
│       └── auth.spec.ts
└── ...
```

---

## ✅ Pre-Submission Test Checklist

| Category | Tests Exist | Tests Pass | Coverage Met |
|:---------|:------------|:-----------|:-------------|
| Unit Tests | ☐ | ☐ | ≥80% |
| Component Tests | ☐ | ☐ | ≥75% |
| Integration Tests | ☐ | ☐ | ≥60% |
| E2E Critical Paths | ☐ | ☐ | All pass |
| Accessibility | ☐ | ☐ | 0 violations |
| RTL Support | ☐ | ☐ | All pass |
| Visual Regression | ☐ | ☐ | No diffs |

---

*Document End | Testing Requirements Version: 1.0.0*
