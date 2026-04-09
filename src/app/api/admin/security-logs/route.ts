import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/security-logs
 * Fetch security logs with optional filters:
 * - reason: filter by reason type
 * - dateFrom / dateTo: date range
 * - email: filter by email
 * - ip: filter by IP
 * - page / limit: pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const email = searchParams.get('email');
    const ip = searchParams.get('ip');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const where: Record<string, unknown> = {};

    if (reason && reason !== 'ALL') {
      where.reason = reason;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    if (email && email.trim()) {
      where.email = { contains: email.trim(), mode: 'insensitive' };
    }

    if (ip && ip.trim()) {
      where.clientIp = { contains: ip.trim() };
    }

    const [logs, total, reasonCounts] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.securityLog.count({ where }),
      prisma.securityLog.groupBy({
        by: ['reason'],
        _count: { reason: true },
        orderBy: { _count: { reason: 'desc' } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        reasonCounts: reasonCounts.map((r) => ({
          reason: r.reason,
          count: r._count.reason,
        })),
      },
    });
  } catch (error) {
    console.error('Security logs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener security logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security-logs
 * Export security logs to CSV with filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reason, dateFrom, dateTo, email, ip } = body;

    const where: Record<string, unknown> = {};

    if (reason && reason !== 'ALL') {
      where.reason = reason;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }
    if (email && email.trim()) {
      where.email = { contains: email.trim(), mode: 'insensitive' };
    }
    if (ip && ip.trim()) {
      where.clientIp = { contains: ip.trim() };
    }

    const logs = await prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['ID', 'IP', 'Email', 'Razón', 'Detalles', 'Fecha'];
    const rows = logs.map((log) =>
      [
        log.id,
        log.clientIp,
        log.email,
        log.reason,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        new Date(log.createdAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
      ].join(',')
    );

    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="security-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export security logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al exportar security logs' },
      { status: 500 }
    );
  }
}
