/**
 * TIER 2: Activity Log helper
 * Logs user actions for audit trail
 */

import { prisma } from '@/lib/db';

export async function logActivity(
  userId: string,
  userEmail: string,
  action: string,
  target?: string,
  details?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        userEmail,
        action,
        target: target || null,
        details: details || null,
      },
    });
  } catch (error) {
    console.error('[ActivityLog] Error logging activity:', error);
  }
}
