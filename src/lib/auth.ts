/**
 * PHASE 4: Authentication utilities
 * JWT generation, token verification, password hashing
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ============ CONSTANTS ============

const JWT_SECRET = process.env.JWT_SECRET || '';
const REFRESH_SECRET = process.env.REFRESH_SECRET || '';

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error('Missing JWT_SECRET or REFRESH_SECRET in .env');
}

const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const BCRYPT_COST = 12; // ~250ms per hash

// ============ PASSWORD HASHING ============

/**
 * Hash a password using bcrypt
 * Cost 12 provides good security + performance balance (~250ms)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_COST);
}

/**
 * Verify plain password against bcrypt hash
 * Returns true if match, false otherwise
 */
export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

// ============ JWT TOKEN GENERATION ============

export interface AccessTokenPayload {
  userId: string;
  role: 'ADMIN' | 'STAFF';
}

/**
 * Generate JWT access token (15 min TTL)
 * Short-lived token for API requests
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

/**
 * Generate JWT refresh token (7 day TTL)
 * Long-lived token for refreshing access tokens
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

// ============ JWT VERIFICATION ============

export interface VerifiedAccessToken {
  userId: string;
  role: 'ADMIN' | 'STAFF';
  iat: number;
  exp: number;
}

/**
 * Verify and decode access token
 * Returns payload if valid, null if invalid/expired
 */
export function verifyAccessToken(token: string): VerifiedAccessToken | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as VerifiedAccessToken;
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode refresh token
 * Returns userId + exp if valid, null if invalid/expired
 */
export function verifyRefreshToken(token: string): { userId: string; exp: number } | null {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as { userId: string; iat: number; exp: number };
    return { userId: payload.userId, exp: payload.exp };
  } catch (error) {
    return null;
  }
}

// ============ TOKEN HASHING (for storage) ============

/**
 * Create SHA256 hash of JWT token
 * Used to store in blacklist without storing plain JWT
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ============ TOKEN EXTRACTION ============

/**
 * Extract JWT from Authorization header
 * Expected format: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
