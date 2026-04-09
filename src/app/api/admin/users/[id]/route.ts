/**
 * TIER 2: Individual User Management API
 * PUT    /api/admin/users/[id] - Update user (email, role, active, password)
 * DELETE /api/admin/users/[id] - Delete user permanently
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, verifyAccessToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, role, active, password } = body;

    // Check user exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Update email if provided
    if (email !== undefined) {
      const emailLower = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        return NextResponse.json(
          { success: false, error: 'Formato de email inválido' },
          { status: 400 }
        );
      }
      // Check uniqueness
      if (emailLower !== existing.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email: emailLower } });
        if (emailTaken) {
          return NextResponse.json(
            { success: false, error: 'Ya existe un usuario con ese email' },
            { status: 409 }
          );
        }
      }
      updateData.email = emailLower;
    }

    // Update role if provided
    if (role !== undefined) {
      if (role !== 'ADMIN' && role !== 'STAFF') {
        return NextResponse.json(
          { success: false, error: 'Rol inválido. Debe ser ADMIN o STAFF' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    // Update active status if provided
    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }
      updateData.password_hash = await hashPassword(password);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
        const changes = Object.keys(updateData).filter(k => k !== 'password_hash').join(', ');
        await logActivity(payload.userId, admin?.email || 'unknown', 'user_edit', id, `Updated ${existing.email}: ${changes}`);
      }
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id } });

    // Log activity
    const token = request.cookies.get('accessToken')?.value;
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const admin = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } });
        await logActivity(payload.userId, admin?.email || 'unknown', 'user_delete', id, `Deleted ${existing.email}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
