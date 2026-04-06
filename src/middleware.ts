/**
 * PHASE 4: Middleware para JWT verification y role-based access control
 * Usado por rutas protegidas (/api/orders GET, /api/orders/[code]/deliver, etc)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// ============ JWT VERIFICATION ============

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userRole?: 'ADMIN' | 'STAFF';
}

/**
 * Middleware para verificar JWT y extractar userId + role
 * Valida que el token:
 * 1. Existe en Authorization header
 * 2. Tiene firma válida
 * 3. NO está expirado
 * 4. NO está en blacklist
 */
export async function verifyJWT(request: NextRequest): Promise<{
  userId: string | null;
  userRole: ('ADMIN' | 'STAFF') | null;
  error: string | null;
}> {
  try {
    // 1. Extract token from header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return { userId: null, userRole: null, error: 'Missing authorization header' };
    }

    // 2. Verify JWT signature + expiration
    const payload = verifyAccessToken(token);
    if (!payload) {
      return { userId: null, userRole: null, error: 'Invalid or expired token' };
    }

    // 3. Check if token is in blacklist
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await prisma.blacklistedToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (blacklisted) {
      return { userId: null, userRole: null, error: 'Token has been revoked' };
    }

    return {
      userId: payload.userId,
      userRole: payload.role,
      error: null,
    };
  } catch (error) {
    return { userId: null, userRole: null, error: 'Token verification failed' };
  }
}

// ============ ROLE-BASED ACCESS CONTROL ============

/**
 * Check if user has required role
 * Used by route handlers to enforce access control
 */
export function hasRequiredRole(
  userRole: ('ADMIN' | 'STAFF') | null,
  requiredRoles: ('ADMIN' | 'STAFF')[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Helper to return 401 Unauthorized
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Helper to return 403 Forbidden
 */
export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
}

// ============ EXPORTS FOR CONVENIENCE ============

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, userId: string, userRole: 'ADMIN' | 'STAFF') => Promise<NextResponse>
): Promise<NextResponse> {
  const { userId, userRole, error } = await verifyJWT(request);

  if (error || !userId || !userRole) {
    return unauthorizedResponse();
  }

  return handler(request, userId, userRole);
}

export async function withRoleAuth(
  request: NextRequest,
  requiredRoles: ('ADMIN' | 'STAFF')[],
  handler: (req: NextRequest, userId: string, userRole: 'ADMIN' | 'STAFF') => Promise<NextResponse>
): Promise<NextResponse> {
  const { userId, userRole, error } = await verifyJWT(request);

  if (error || !userId || !userRole) {
    return unauthorizedResponse();
  }

  if (!hasRequiredRole(userRole, requiredRoles)) {
    return forbiddenResponse();
  }

  return handler(request, userId, userRole);
}
