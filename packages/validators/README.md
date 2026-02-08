# @apex/validators

Zod validation schemas for the Apex v2 template system. Provides type-safe validation for all data contracts.

## 📦 Installation

```bash
bun add @apex/validators
```

## 🚀 Usage

### Basic Validation

```typescript
import { ProductSchema, TenantConfigSchema } from '@apex/validators';

// Validate product data
const result = ProductSchema.safeParse(productData);

if (!result.success) {
  console.error('Validation errors:', result.error.flatten());
} else {
  const validProduct = result.data; // Fully typed!
}
```

### TypeScript Types

All schemas export corresponding TypeScript types:

```typescript
import type { Product, TenantConfig, Cart, Order } from '@apex/validators';

function processProduct(product: Product) {
  // product is fully typed
  console.log(product.name, product.price);
}
```

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterCustomerSchema } from '@apex/validators';

const form = useForm({
  resolver: zodResolver(RegisterCustomerSchema),
});
```

### API Route Validation (Next.js)

```typescript
import { CreateOrderSchema } from '@apex/validators';

export async function POST(request: Request) {
  const body = await request.json();
  const result = CreateOrderSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten() }, 
      { status: 400 }
    );
  }
  
  // Process validated order
  const validatedOrder = result.data;
}
```

## 📋 Available Schemas

### Tenant Configuration

```typescript
import { TenantConfigSchema } from '@apex/validators';
```

- **TenantConfigSchema**: Complete tenant configuration
- **TenantConfigUpdateSchema**: Partial updates

### Products

```typescript
import { 
  ProductSchema, 
  ProductVariantSchema,
  ProductListItemSchema 
} from '@apex/validators';
```

- **ProductSchema**: Full product details
- **ProductVariantSchema**: Product variant
- **ProductListItemSchema**: Minimal fields for list views

### Cart

```typescript
import { 
  CartSchema, 
  CartItemSchema,
  AddToCartSchema,
  UpdateCartItemSchema 
} from '@apex/validators';
```

- **CartSchema**: Shopping cart
- **CartItemSchema**: Individual cart item
- **AddToCartSchema**: Add to cart request
- **UpdateCartItemSchema**: Update cart item quantity

### Orders

```typescript
import { 
  OrderSchema, 
  OrderItemSchema,
  AddressSchema,
  CreateOrderSchema,
  OrderStatusSchema,
  PaymentMethodSchema 
} from '@apex/validators';
```

- **OrderSchema**: Complete order
- **OrderItemSchema**: Order line item
- **AddressSchema**: Shipping/billing address
- **CreateOrderSchema**: Checkout request
- **OrderStatusSchema**: Enum for order status
- **PaymentMethodSchema**: Enum for payment methods

### Categories

```typescript
import { CategorySchema, CategoryTreeNodeSchema } from '@apex/validators';
```

- **CategorySchema**: Single category
- **CategoryTreeNodeSchema**: Recursive category tree

### Reviews

```typescript
import { ReviewSchema, CreateReviewSchema } from '@apex/validators';
```

- **ReviewSchema**: Product review
- **CreateReviewSchema**: Submit review request

### Customers

```typescript
import { 
  CustomerSchema, 
  RegisterCustomerSchema,
  LoginCustomerSchema,
  UpdateCustomerSchema 
} from '@apex/validators';
```

- **CustomerSchema**: Customer profile
- **RegisterCustomerSchema**: Registration request
- **LoginCustomerSchema**: Login credentials
- **UpdateCustomerSchema**: Profile updates

## 🔒 Security Features

All schemas enforce:

- **S3 Input Validation**: Every field validated
- **Type Safety**: Full TypeScript inference
- **Length Limits**: Prevent DoS attacks
- **Format Validation**: Email, URL, UUID, ISO codes
- **Enum Constraints**: Only allowed values

## 📚 Examples

### Validate Email

```typescript
import { RegisterCustomerSchema } from '@apex/validators';

const email = RegisterCustomerSchema.shape.email.safeParse('test@example.com');
// ✅ Valid

const badEmail = RegisterCustomerSchema.shape.email.safeParse('not-an-email');
// ❌ Invalid email address
```

### Price Validation

```typescript
import { ProductSchema } from '@apex/validators';

const price = ProductSchema.shape.price.safeParse(29.99);
// ✅ Valid

const negativePrice = ProductSchema.shape.price.safeParse(-10);
// ❌ Price must be positive
```

### Nested Validation

```typescript
import { OrderSchema } from '@apex/validators';

const order = {
  // ... order fields
  shippingAddress: {
    name: 'John Doe',
    line1: '123 Main St',
    city: 'New York',
    country: 'US', // Must be ISO 3166-1 alpha-2
    postalCode: '10001',
  },
};

const result = OrderSchema.safeParse(order);
```

## 🧪 Testing

Schemas are battle-tested with:

- **Unit tests**: Coverage > 95%
- **Edge cases**: Boundary values, null handling
- **Type safety**: Compile-time checks

## 📖 Documentation

For complete specification, see:
- [01-data-contracts.md](../../docs/template-system/01-data-contracts.md)

## 🛠️ Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type check
bun run type-check

# Run tests (user-created)
bun test
```

## 📄 License

MIT
