# @apex/test-utils

Testing utilities for Apex v2 templates. Provides mock data factories, MSW handlers, and test helpers to achieve comprehensive test coverage.

## 🚀 Installation

```bash
bun add -d @apex/test-utils
```

## 📖 Usage

### Mock Data Fixtures

Generate realistic test data with Faker.js:

```typescript
import { 
  createMockProduct,
  createMockCart,
  createMockOrder,
  createMockCustomer
} from '@apex/test-utils';

describe('ProductCard', () => {
  it('should render product name', () => {
    const product = createMockProduct({ name: 'Test Product' });
    
    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

Available fixtures:
- **Products**: `createMockProduct()`, `createMockProductList()`, `createOutOfStockProduct()`, `createFeaturedProduct()`
- **Cart**: `createMockCart()`, `createEmptyCart()`, `createGuestCart()`, `createMockCartItem()`
- **Orders**: `createMockOrder()`, `createPendingOrder()`, `createDeliveredOrder()`, `createMockAddress()`
- **Customers**: `createMockCustomer()`, `createVIPCustomer()`, `createNewCustomer()`

### MSW API Mocking

Mock API responses for integration tests:

```typescript
import { setupMswServer, server } from '@apex/test-utils';
import { http, HttpResponse } from 'msw';

// In vitest.setup.ts
setupMswServer();

// Override specific endpoints in tests
describe('ProductList', () => {
  it('should handle API error', async () => {
    server.use(
      http.get('/api/products', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );
    
    render(<ProductList />);
    await waitFor(() => {
      expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
    });
  });
});
```

Available handlers:
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add to cart
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order

### Custom Test Data

Override any fixture properties:

```typescript
const product = createMockProduct({
  id: 'custom-id',
  name: 'Custom Name',
  price: 99.99,
  inStock: false,
});

const cart = createMockCart({
  items: [
    createMockCartItem({ quantity: 5 }),
    createMockCartItem({ quantity: 2 }),
  ],
});

const order = createMockOrder({
  status: 'delivered',
  paymentStatus: 'paid',
});
```

## 🧪 Testing Best Practices

### Unit Tests

```typescript
import { createMockProduct } from '@apex/test-utils';

describe('calculateDiscount', () => {
  it('should calculate percentage correctly', () => {
    const product = createMockProduct({
      price: 80,
      compareAtPrice: 100,
    });
    
    expect(calculateDiscount(product)).toBe(20);
  });
});
```

### Component Tests

```typescript
import { createMockProduct } from '@apex/test-utils';
import { render, screen } from '@testing-library/react';

describe('ProductCard', () => {
  it('should show discount badge', () => {
    const product = createMockProduct({
      price: 80,
      compareAtPrice: 100,
    });
    
    render(<ProductCard product={product} />);
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { setupMswServer, createMockProductList } from '@apex/test-utils';

setupMswServer();

describe('ProductListPage', () => {
  it('should render products from API', async () => {
    render(<ProductListPage />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('product-card')).toHaveLength(12);
    });
  });
});
```

## 📊 Coverage Requirements

Templates must meet these minimum coverage gates:

| Test Type | Minimum | Files |
|-----------|---------|-------|
| Unit Tests | 80% | `*.test.ts` |
| Component Tests | 75% | `*.test.tsx` |
| Integration Tests | 60% | `__tests__/integration/*.test.ts` |

## 🔧 Vitest Configuration

```typescript
// vitest.setup.ts
import { setupMswServer } from '@apex/test-utils';

setupMswServer();
```

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

## 📚 Related

- [Testing Requirements](../../docs/template-system/04-testing-requirements.md)
- [Data Contracts](../../docs/template-system/01-data-contracts.md)

## 📄 License

MIT
