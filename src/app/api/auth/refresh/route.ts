/**
 * PHASE 4: POST /api/auth/refresh
 * Endpoint para refrescar access token usando refresh token
 * Input: { refreshToken }
 * Output: { accessToken, expiresIn }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyRefreshToken,
  generateAccessToken,
  hashToken,
} from '@/lib/auth';
import crypto from 'crypto';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    let refreshToken: string | null = null;

    try {
      const body = await request.json();
      refreshToken = body.refreshToken || null;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // 1. Verify refresh token signature
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // 2. Check if token is in blacklist
    const tokenHash = hashToken(refreshToken);
    const isBlacklisted = await db.blacklistedToken.isBlacklisted(tokenHash);

    if (isBlacklisted) {
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // 3. Get user to verify role
    const user = await db.user.findById(payload.userId);

    if (!user || !user.active) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // 4. Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role as 'ADMIN' | 'STAFF',
    });

    console.log(`✅ TOKEN REFRESH: User ${user.email} from IP ${clientIP}`);

    return NextResponse.json(
      {
        accessToken: newAccessToken,
        expiresIn: 900, // 15 minutes
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in POST /api/auth/refresh:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
