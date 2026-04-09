/**
 * TIER 2: User Management API
 * GET  /api/admin/users - List all users (including inactive)
 * POST /api/admin/users - Create a new staff user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, verifyAccessToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con ese email' },
        { status: 409 }
      );
    }

    const validRole = role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    const password_hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        password_hash,
        role: validRole,
        active: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    // Log activity
    const token = request.cookies.get('accessToken')?.value;
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const admin = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } });
        await logActivity(payload.userId, admin?.email || 'unknown', 'user_create', user.id, `Created ${emailLower} as ${validRole}`);
      }
    }

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
