# 🔐 Template Security Protocols
*S1-S14 Compliance Checklist for Elite Security Gates*

---

## 🎯 Purpose

Every storefront template MUST comply with all 14 security protocols defined in the **Elite Security Pipeline**. This document provides a **checklist** for template developers. Compliance is programmatically verified by the CI/CD gates using specialized TS scanners and Vitest integration tests.

---

## ✅ S1: Environment Verification

**Requirement:** Template MUST NOT start if required environment variables are missing.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | Template imports from `@apex/config` | No direct `process.env` access |
| ☐ | All required vars defined in config schema | Zod schema validates on boot |
| ☐ | Graceful error message on missing vars | Clear error, not stack trace |

### Required Environment Variables

```typescript
// Templates must consume these (never define their own)
import { env } from '@apex/config';

// Available variables:
env.NEXT_PUBLIC_API_URL     // Backend API base URL
env.NEXT_PUBLIC_TENANT_ID   // Current tenant context
env.NEXT_PUBLIC_MINIO_URL   // Asset storage URL
```

### Anti-Patterns

```typescript
// ❌ FORBIDDEN: Direct process.env access
const apiUrl = process.env.API_URL; 

// ✅ CORRECT: Use @apex/config
import { env } from '@apex/config';
const apiUrl = env.NEXT_PUBLIC_API_URL;
```

---

## ✅ S2: Tenant Isolation

**Requirement:** Template MUST operate ONLY within its assigned tenant context.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | Never hardcode tenant IDs | All tenant context from config/middleware |
| ☐ | API calls include tenant context | Subdomain extraction or header |
| ☐ | No cross-tenant data references | Impossible to access other tenant data |
| ☐ | Assets scoped to tenant bucket | `minio://tenant-{id}/...` paths |

### Implementation Patterns

```typescript
// Middleware extracts tenant from subdomain
// Template receives tenant context via:

// 1. React Context
import { useTenant } from '@apex/ui/contexts';
const { tenantId, config } = useTenant();

// 2. Server Component Props
export default function Page({ params }: { params: { tenantId: string } }) {
  // tenantId guaranteed by routing
}

// 3. API Route Context
import { getTenantContext } from '@apex/auth';
const tenant = getTenantContext(request);
```

### Test Requirement

```typescript
describe('S2: Tenant Isolation', () => {
  it('should NOT return data from other tenants', async () => {
    // Given: User authenticated as tenant-a
    // When: Attempting to access tenant-b resources
    // Then: Returns 403 or empty result
  });
});
```

---

## ✅ S3: Input Validation

**Requirement:** ALL user input MUST be validated via Zod before processing.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | Form inputs use Zod schemas | Imported from `@apex/validators` |
| ☐ | Unknown properties stripped | `z.object().strict()` or whitelist |
| ☐ | Error messages user-friendly | No internal error exposure |
| ☐ | Server-side re-validation | Never trust client validation alone |

### Implementation Patterns

```typescript
// Client-side (React Hook Form + Zod)
import { CheckoutFormSchema } from '@apex/validators';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(CheckoutFormSchema),
});

// Server-side (API Route)
import { CheckoutFormSchema } from '@apex/validators';

export async function POST(request: Request) {
  const body = await request.json();
  const result = CheckoutFormSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json({ errors: result.error.flatten() }, { status: 400 });
  }
  
  // Proceed with validated data
  const validated = result.data;
}
```

### Forbidden Patterns

```typescript
// ❌ NEVER: Inline validation without schema
if (email.includes('@')) { /* ... */ }

// ❌ NEVER: Trust client-submitted IDs directly
const productId = body.productId; // MUST validate first

// ❌ NEVER: Render unsanitized user content
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // XSS risk
```

---

## ✅ S4: Audit Logging

**Requirement:** All significant user actions MUST be logged for audit trail.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | Order creation logged | AUDIT_ORDER_CREATED |
| ☐ | Login/logout logged | AUDIT_LOGIN, AUDIT_LOGOUT |
| ☐ | Profile updates logged | AUDIT_PROFILE_UPDATED |
| ☐ | Address changes logged | AUDIT_ADDRESS_MODIFIED |

### Implementation Pattern

Templates don't write audit logs directly. The backend interceptor handles this.

```typescript
// Template makes standard API call:
await fetch('/api/orders', { method: 'POST', body });

// Backend interceptor automatically logs:
// INSERT INTO audit_logs VALUES (
//   user_id, 'ORDER_CREATED', 'tenant_xyz', 
//   '192.168.1.1', NOW(), { orderId: '...' }
// )
```

### Test Requirement

```typescript
describe('S4: Audit Logging', () => {
  it('should create audit entry on order placement', async () => {
    await placeOrder(validOrderData);
    
    const auditEntry = await db.query('SELECT * FROM audit_logs WHERE action = "ORDER_CREATED"');
    expect(auditEntry.rows.length).toBe(1);
  });
});
```

---

## ✅ S5: Exception Handling

**Requirement:** Errors MUST be handled gracefully without exposing internals.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | Error boundaries for React | Catch component crashes |
| ☐ | User-friendly error messages | No stack traces to user |
| ☐ | Errors reported to GlitchTip | Automatic via integration |
| ☐ | Custom 500/404 pages | Branded error pages |

### Implementation Patterns

```typescript
// Error Boundary (React)
'use client';
import { ErrorBoundary } from '@apex/ui/components';

export default function Layout({ children }) {
  return (
    <ErrorBoundary
      fallback={<ErrorPage />}
      onError={(error) => reportToGlitchTip(error)}
    >
      {children}
    </ErrorBoundary>
  );
}

// API Error Response
return Response.json(
  { 
    error: 'Unable to process your request',
    code: 'CHECKOUT_FAILED',
    // ❌ NEVER: Include stack trace or internal details
  }, 
  { status: 500 }
);
```

---

## ✅ S6: Rate Limiting

**Requirement:** Template MUST respect rate limits and show appropriate UI.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | Handle 429 responses gracefully | Show "Too many requests" message |
| ☐ | Debounce rapid user actions | Search, add-to-cart clicks |
| ☐ | Show retry-after indication | From `X-RateLimit-Reset` header |

### Implementation Pattern

```typescript
// API call with rate limit handling
async function apiCall(url: string) {
  const response = await fetch(url);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('X-RateLimit-Reset');
    throw new RateLimitError(`Please try again in ${retryAfter} seconds`);
  }
  
  return response.json();
}

// Debounce search input
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback((query) => {
  searchProducts(query);
}, 300);
```

---

## ✅ S7: Encryption

**Requirement:** Sensitive data MUST be encrypted in transit and at rest.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | All API calls over HTTPS | Enforced by Traefik |
| ☐ | No sensitive data in localStorage | Session tokens in httpOnly cookies |
| ☐ | Payment data via Stripe Elements | Never touches our servers |
| ☐ | PII not logged to console | No email/phone in logs |

### Forbidden Patterns

```typescript
// ❌ NEVER: Store sensitive data client-side
localStorage.setItem('jwt', token);
localStorage.setItem('creditCard', cardNumber);

// ❌ NEVER: Log PII
console.log('User email:', user.email);

// ❌ NEVER: Handle raw card numbers
const cardNumber = inputRef.current.value; // MUST use Stripe Elements
```

---

## ✅ S8: Web Security Headers

**Requirement:** Template MUST NOT bypass security headers set by backend.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | No inline scripts | All JS in external files |
| ☐ | CSP-compliant resources | Images/fonts from allowed origins |
| ☐ | No `target="_blank"` without `rel="noopener"` | XSS prevention |
| ☐ | CSRF token on forms | Auto-handled by auth package |

### Implementation Pattern

```typescript
// Image sources must be from allowed origins
<Image 
  src={`${env.NEXT_PUBLIC_MINIO_URL}/tenant-${tenantId}/products/image.jpg`}
  alt="Product"
/>

// External links must have noopener
<a 
  href="https://external-site.com" 
  target="_blank" 
  rel="noopener noreferrer"
>
  External Link
</a>
```

---

## ✅ S9: Health Checks

**Requirement:** Template MUST integrate with platform health monitoring.

### Checklist

| Item | Implementation | Verification |
|:-----|:---------------|:-------------|
| ☐ | Expose `/health` endpoint | Returns 200 if healthy |
| ☐ | Check critical dependencies | API connectivity |
| ☐ | Graceful degradation | Show cached content if API down |

### Implementation Pattern

```typescript
// app/health/route.ts
export async function GET() {
  try {
    // Check API connectivity
    const apiHealth = await fetch(`${env.NEXT_PUBLIC_API_URL}/health`);
    
    if (!apiHealth.ok) {
      return Response.json({ status: 'degraded', api: 'unreachable' }, { status: 503 });
    }
    
    return Response.json({ status: 'healthy' }, { status: 200 });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

---

## 📋 Pre-Submission Checklist

Before submitting a template for review:

- [ ] All S1-S9 checklists completed
- [ ] Security tests written and passing
- [ ] No hardcoded secrets or API keys
- [ ] No direct database queries
- [ ] All PII handling follows encryption guidelines
- [ ] Error boundaries implemented
- [ ] Rate limit handling implemented

---

*Document End | Security Protocol Version: 1.0.0*
