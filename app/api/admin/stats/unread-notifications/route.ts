import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get unread notifications count
    const unreadCount = await prisma.notification.count({
      where: {
        status: 'UNREAD'
      }
    });

    // Get notifications by type
    const notificationsByType = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        status: 'UNREAD'
      },
      _count: {
        notificationId: true
      }
    });

    // Get recent notifications (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNotifications = await prisma.notification.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        },
        status: 'UNREAD'
      }
    });

    // Get critical notifications (overdue books, fines, etc.)
    const criticalNotifications = await prisma.notification.count({
      where: {
        status: 'UNREAD',
        type: {
          in: ['BOOK_OVERDUE', 'FINE_NOTICE']
        }
      }
    });

    const typeBreakdown = notificationsByType.reduce((acc, item) => {
      acc[item.type] = item._count.notificationId;
      return acc;
    }, {} as Record<string, number>);

    const response = {
      unreadCount,
      recentNotifications,
      criticalNotifications,
      breakdown: typeBreakdown,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch notification statistics',
        unreadCount: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
