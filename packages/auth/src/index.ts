/**
 * Authentication & Authorization Module
 * S2: Tenant Isolation Enforcement via TenantScopedGuard
 */

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        tenantId: string;
        role: string;
        impersonating?: boolean;
    };
    tenantId: string;
}

@Injectable()
export class TenantScopedGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        // 1. Extract JWT from cookie or header
        const token = this.extractToken(request);
        if (!token) {
            throw new UnauthorizedException('Authentication required');
        }

        // 2. Verify JWT
        try {
            const payload = await this.jwtService.verifyAsync(token);
            request.user = payload;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }

        // 3. S2: Extract and validate tenant context
        const requestedTenantId = this.extractTenantId(request);

        if (!requestedTenantId) {
            throw new ForbiddenException('S2 Violation: Tenant context required');
        }

        // 4. S2: Strict Tenant Isolation Check
        // User can ONLY access their own tenant (unless impersonating as Super Admin)
        if (payload.tenantId !== requestedTenantId && !payload.impersonating) {
            // Log security event (S4 Audit)
            console.error(`🚨 S2 Violation: User ${payload.userId} from tenant ${payload.tenantId} attempted to access tenant ${requestedTenantId}`);

            throw new ForbiddenException(
                'S2 Isolation Violation: Cross-tenant access denied'
            );
        }

        // 5. Set tenant context for downstream use
        request.tenantId = requestedTenantId;

        return true;
    }

    private extractToken(request: Request): string | undefined {
        // Check Authorization header
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Check httpOnly cookie
        return request.cookies?.jwt;
    }

    private extractTenantId(request: Request): string | undefined {
        // Priority 1: X-Tenant-ID header
        const headerTenant = request.headers['x-tenant-id'];
        if (headerTenant) return headerTenant as string;

        // Priority 2: Subdomain (e.g., tenant1.apex.com)
        const host = request.headers.host || '';
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'apex') {
            return subdomain;
        }

        // Priority 3: Query param (for development)
        return request.query.tenantId as string;
    }
}

/**
 * Super Admin Guard (for God Mode)
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        if (request.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Super Admin access required');
        }

        return true;
    }
}

/**
 * JWT Strategy Configuration
 */
export const JwtStrategyConfig = {
    secret: process.env.JWT_SECRET,
    signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
};
