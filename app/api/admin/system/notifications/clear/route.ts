import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Clear old notifications
export async function POST(request: NextRequest) {
  try {
    const { olderThanDays = 7, readOnly = true } = await request.json();

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Build where clause
    const whereClause: any = {
      createdAt: {
        lt: cutoffDate
      }
    };

    // If readOnly is true, only delete read notifications
    if (readOnly) {
      whereClause.isRead = true;
    }

    // Get count of notifications to be deleted
    const countToDelete = await prisma.notification.count({
      where: whereClause
    });

    if (countToDelete === 0) {
      return NextResponse.json({
        success: true,
        message: 'No notifications found to clear',
        deletedCount: 0
      });
    }

    // Delete notifications in transaction
    const result = await prisma.$transaction(async (tx) => {
      const deleteResult = await tx.notification.deleteMany({
        where: whereClause
      });

      // Create audit log entry
      await tx.systemLog.create({
        data: {
          level: 'INFO',
          message: `System cleared ${deleteResult.count} ${readOnly ? 'read ' : ''}notifications older than ${olderThanDays} days`,
          source: 'NOTIFICATION_CLEANUP',
          timestamp: new Date()
        }
      });

      return deleteResult;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${result.count} old notifications`,
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      readOnly
    });

  } catch (error) {
    console.error('Error clearing notifications:', error);
    
    // Log the error
    try {
      await prisma.systemLog.create({
        data: {
          level: 'ERROR',
          message: `Failed to clear old notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
          source: 'NOTIFICATION_CLEANUP',
          timestamp: new Date()
        }
      });
    } catch (logError) {
      console.error('Failed to log notification cleanup error:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'Failed to clear notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
