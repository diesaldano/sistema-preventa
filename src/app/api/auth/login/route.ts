/**
 * PHASE 4: POST /api/auth/login
 * Endpoint para autenticación de admin/staff
 * Input: { email, password }
 * Output: { accessToken, refreshToken, expiresIn }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, prisma } from '@/lib/db';
import { 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken 
} from '@/lib/auth';
import { logSecurityEvent } from '@/lib/rate-limiter';
import { logActivity } from '@/lib/activity-log';

/**
 * Extraer IP del cliente
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  try {
    // 1. Parse request body
    let email: string | null = null;
    let password: string | null = null;

    try {
      const body = await request.json();
      email = body.email?.toLowerCase().trim() || null;
      password = body.password || null;
    } catch (error) {
      await logSecurityEvent(clientIP, 'unknown', 'invalid_input', 'Invalid JSON body');
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // 2. Validate inputs
    if (!email || !password) {
      await logSecurityEvent(clientIP, email || 'unknown', 'invalid_input', 'Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 3. Rate limit: 5 attempts per 15 minutes per IP
    const recentAttempts = await db.securityLog.getByIP(clientIP, 1); // last 1 hour
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentFailures = recentAttempts
      .filter(log => log.createdAt > fifteenMinutesAgo)
      .filter(log => log.reason === 'login_attempt_failed' || log.reason === 'rate_limit_login');

    if (recentFailures.length >= 5) {
      await logSecurityEvent(clientIP, email, 'rate_limit_login', `Too many login attempts: ${recentFailures.length}`);
      return NextResponse.json(
        { error: 'Too many login attempts. Try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // 4. Find user by email
    const user = await db.user.findByEmail(email);

    if (!user || !user.active) {
      await logSecurityEvent(clientIP, email, 'invalid_input', 'User not found or inactive');
      // Don't reveal if user exists (security best practice)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 5. Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      await logSecurityEvent(clientIP, email, 'invalid_input', 'Invalid password');
      // Log failed attempt
      await db.securityLog.create(clientIP, email, 'login_attempt_failed', 'Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 6. Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role as 'ADMIN' | 'STAFF',
    });

    const refreshToken = generateRefreshToken(user.id);

    console.log(`✅ LOGIN SUCCESS: User ${email} (${user.role}) from IP ${clientIP}`);
    await logSecurityEvent(clientIP, email, 'login_success', `Role: ${user.role}`);
    await logActivity(user.id, email, 'login', undefined, `IP: ${clientIP}`);

    const response = NextResponse.json(
      {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set access token in secure HTTP cookie (middleware will verify)
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900, // 15 minutes
    });

    // Also set refresh token in secure HTTP cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/api/auth/refresh', // Only send to refresh endpoint
    });

    return response;

  } catch (error) {
    console.error('❌ Error in POST /api/auth/login:', error);
    
    await logSecurityEvent(
      clientIP,
      'unknown',
      'invalid_input',
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
