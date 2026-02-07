/**
 * S2: Tenant Isolation Middleware
 * Constitution Reference: architecture.md (S2 Protocol)
 * Purpose: Extract tenant from subdomain and enforce schema isolation
 */

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantStorage, TenantContext } from './connection-context.js';

export interface TenantRequest extends Request {
  tenantContext?: TenantContext;
}

/**
 * Extracts tenant ID from subdomain
 * e.g., alpha.apex.localhost -> alpha
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Localhost development
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }
    return null; // Root domain
  }
  
  // Production
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

/**
 * Validates tenant exists and is active
 */
async function validateTenant(subdomain: string): Promise<TenantContext> {
  // TODO: Query database
  // const tenant = await db.query.tenants.findFirst({
  //   where: eq(tenants.subdomain, subdomain)
  // });
  
  // Mock for now - will be replaced with DB query
  if (subdomain === 'invalid') {
    throw new UnauthorizedException('Tenant not found');
  }
  
  return {
    tenantId: `tenant_${subdomain}`,
    schemaName: `tenant_${subdomain}`,
    subdomain,
    plan: 'pro',
    isActive: true,
  };
}

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const subdomain = extractSubdomain(host);
    
    if (!subdomain) {
      // Allow root domain requests (e.g., landing page)
      return next();
    }
    
    try {
      const tenantContext = await validateTenant(subdomain);
      
      // Store in AsyncLocalStorage for downstream access
      tenantStorage.run(tenantContext, () => {
        req.tenantContext = tenantContext;
        
        // Set PostgreSQL search_path for this request
        // This ensures all queries go to tenant schema
        res.setHeader('X-Tenant-ID', tenantContext.tenantId);
        res.setHeader('X-Tenant-Schema', tenantContext.schemaName);
        
        next();
      });
    } catch (error) {
      throw new UnauthorizedException(`Invalid tenant: ${subdomain}`);
    }
  }
}

/**
 * NestJS Guard for Tenant Access Control
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class TenantScopedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    
    if (!request.tenantContext) {
      throw new UnauthorizedException('Tenant context required');
    }
    
    if (!request.tenantContext.isActive) {
      throw new UnauthorizedException('Tenant is suspended');
    }
    
    return true;
  }
}

/**
 * Super Admin can access any tenant
 */
@Injectable()
export class SuperAdminOrTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user as any;
    
    // Super admin bypass
    if (user?.role === 'super_admin') {
      return true;
    }
    
    // Regular tenant check
    if (!request.tenantContext?.isActive) {
      throw new UnauthorizedException('Tenant access denied');
    }
    
    // Ensure user belongs to this tenant
    if (user?.tenantId !== request.tenantContext.tenantId) {
      throw new UnauthorizedException('Cross-tenant access denied');
    }
    
    return true;
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
