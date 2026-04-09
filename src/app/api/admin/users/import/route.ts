/**
 * TIER 2: Bulk CSV Import for Users
 * POST /api/admin/users/import
 * Expects CSV with columns: email, password, role (optional)
 * Returns created/skipped/error counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Se requiere el contenido CSV' },
        { status: 400 }
      );
    }

    // Remove BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'El CSV debe tener al menos un encabezado y una fila de datos' },
        { status: 400 }
      );
    }

    // Parse header
    const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const emailIdx = header.indexOf('email');
    const passwordIdx = header.indexOf('password');
    const roleIdx = header.indexOf('role');

    if (emailIdx === -1 || passwordIdx === -1) {
      return NextResponse.json(
        { success: false, error: 'El CSV debe tener columnas "email" y "password"' },
        { status: 400 }
      );
    }

    const result: ImportResult = { created: 0, skipped: 0, errors: [] };

    // Process rows
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const email = cols[emailIdx]?.toLowerCase().trim();
      const password = cols[passwordIdx]?.trim();
      const roleRaw = roleIdx !== -1 ? cols[roleIdx]?.trim().toUpperCase() : 'STAFF';
      const role = roleRaw === 'ADMIN' ? 'ADMIN' : 'STAFF';

      if (!email || !password) {
        result.errors.push(`Fila ${i + 1}: email o contraseña vacío`);
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        result.errors.push(`Fila ${i + 1}: email inválido (${email})`);
        continue;
      }

      if (password.length < 6) {
        result.errors.push(`Fila ${i + 1}: contraseña muy corta (${email})`);
        continue;
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        result.skipped++;
        continue;
      }

      try {
        const password_hash = await hashPassword(password);
        await prisma.user.create({
          data: {
            email,
            password_hash,
            role,
            active: true,
          },
        });
        result.created++;
      } catch (err) {
        result.errors.push(`Fila ${i + 1}: error al crear (${email})`);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error importing users:', error);
    return NextResponse.json(
      { success: false, error: 'Error al importar usuarios' },
      { status: 500 }
    );
  }
}
