import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');
    const recipientType = searchParams.get('recipientType');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!recipientId || !recipientType) {
      return NextResponse.json(
        { error: 'Recipient ID and type are required' },
        { status: 400 }
      );
    }

    const parsedRecipientId = parseInt(recipientId);
    if (isNaN(parsedRecipientId)) {
      return NextResponse.json(
        { error: 'Recipient ID must be a valid number' },
        { status: 400 }
      );
    }

    if (!['PATRON', 'LIBRARIAN'].includes(recipientType)) {
      return NextResponse.json(
        { error: 'Recipient type must be PATRON or LIBRARIAN' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      recipientId: parsedRecipientId,
      recipientType: recipientType
    };

    if (status && ['UNREAD', 'READ'].includes(status)) {
      whereClause.status = status;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.notification.count({
        where: whereClause
      }),
      prisma.notification.count({
        where: {
          recipientId: parsedRecipientId,
          recipientType: recipientType,
          status: 'UNREAD'
        }
      })
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const { notificationIds, markAllAsRead, recipientId, recipientType } = await request.json();

    if (markAllAsRead) {
      if (!recipientId || !recipientType) {
        return NextResponse.json(
          { error: 'Recipient ID and type are required for marking all as read' },
          { status: 400 }
        );
      }

      const parsedRecipientId = parseInt(recipientId);
      if (isNaN(parsedRecipientId)) {
        return NextResponse.json(
          { error: 'Recipient ID must be a valid number' },
          { status: 400 }
        );
      }

      // Mark all notifications as read for the user
      await prisma.notification.updateMany({
        where: {
          recipientId: parsedRecipientId,
          recipientType: recipientType,
          status: 'UNREAD'
        },
        data: {
          status: 'READ',
          readAt: new Date()
        }
      });

      return NextResponse.json({
        message: 'All notifications marked as read'
      });

    } else {
      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return NextResponse.json(
          { error: 'Notification IDs array is required' },
          { status: 400 }
        );
      }

      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          notificationId: {
            in: notificationIds.map(id => parseInt(id))
          },
          status: 'UNREAD'
        },
        data: {
          status: 'READ',
          readAt: new Date()
        }
      });

      return NextResponse.json({
        message: `${notificationIds.length} notification(s) marked as read`
      });
    }

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const parsedNotificationId = parseInt(notificationId);
    if (isNaN(parsedNotificationId)) {
      return NextResponse.json(
        { error: 'Notification ID must be a valid number' },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: {
        notificationId: parsedNotificationId
      }
    });

    return NextResponse.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
