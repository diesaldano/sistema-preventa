/**
 * PHASE 4: POST /api/auth/logout
 * Endpoint para logout del sistema
 * Agrega tokens a blacklist para invalidarlos
 * Input: { accessToken, refreshToken }
 * Output: { success: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  hashToken,
} from '@/lib/auth';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    try {
      const body = await request.json();
      accessToken = body.accessToken || null;
      refreshToken = body.refreshToken || null;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Both accessToken and refreshToken are required' },
        { status: 400 }
      );
    }

    // 1. Verify access token (for user ID)
    const accessPayload = verifyAccessToken(accessToken);
    if (!accessPayload) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // 2. Verify refresh token
    const refreshPayload = verifyRefreshToken(refreshToken);
    if (!refreshPayload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // 3. Ensure both tokens belong to same user
    if (accessPayload.userId !== refreshPayload.userId) {
      return NextResponse.json(
        { error: 'Token mismatch' },
        { status: 401 }
      );
    }

    const userId = accessPayload.userId;

    // 4. Add both tokens to blacklist
    const accessTokenHash = hashToken(accessToken);
    const refreshTokenHash = hashToken(refreshToken);

    // Get expiration times from tokens
    const accessExpiry = new Date(accessPayload.exp * 1000);
    const refreshExpiry = new Date(refreshPayload.exp * 1000);

    // Add to blacklist
    await Promise.all([
      db.blacklistedToken.create(
        accessTokenHash,
        userId,
        'ACCESS',
        accessExpiry,
        'logout'
      ),
      db.blacklistedToken.create(
        refreshTokenHash,
        userId,
        'REFRESH',
        refreshExpiry,
        'logout'
      ),
    ]);

    console.log(`✅ LOGOUT SUCCESS: User ${userId} from IP ${clientIP}`);

    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear authentication cookies
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;

  } catch (error) {
    console.error('❌ Error in POST /api/auth/logout:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
