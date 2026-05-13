import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch notifications with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const read = searchParams.get('read');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = {};

    // Apply filters
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    if (read && read !== 'ALL') {
      whereClause.isRead = read === 'READ';
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          notificationId: true,
          recipientType: true,
          type: true,
          title: true,
          message: true,
          createdAt: true,
          readAt: true,
          isRead: true,
          recipientId: true,
          // Get recipient name based on type
          patron: {
            select: {
              patronFirstName: true,
              patronLastName: true
            }
          },
          admin: {
            select: {
              adminFirstName: true,
              adminLastName: true
            }
          },
          librarian: {
            select: {
              librarianFirstName: true,
              librarianLastName: true
            }
          }
        }
      }),
      prisma.notification.count({ where: whereClause })
    ]);

    // Format notifications with recipient names
    const formattedNotifications = notifications.map(notification => {
      let recipientName = 'Unknown';
      
      switch (notification.recipientType) {
        case 'PATRON':
          if (notification.patron) {
            recipientName = `${notification.patron.patronFirstName} ${notification.patron.patronLastName}`;
          }
          break;
        case 'ADMIN':
          if (notification.admin) {
            recipientName = `${notification.admin.adminFirstName} ${notification.admin.adminLastName}`;
          }
          break;
        case 'LIBRARIAN':
          if (notification.librarian) {
            recipientName = `${notification.librarian.librarianFirstName} ${notification.librarian.librarianLastName}`;
          }
          break;
      }

      return {
        id: notification.notificationId.toString(),
        recipientType: notification.recipientType,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString() || null,
        isRead: notification.isRead,
        recipientName
      };
    });

    // Get distinct types for filtering
    const types = await prisma.notification.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' }
    });

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      types: types.map(t => t.type)
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Remove selected notifications
export async function DELETE(request: NextRequest) {
  try {
    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    // Convert string IDs to numbers
    const numericIds = notificationIds.map(id => parseInt(id)).filter(id => !isNaN(id));

    if (numericIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid notification IDs are required' },
        { status: 400 }
      );
    }

    const deleteResult = await prisma.notification.deleteMany({
      where: {
        notificationId: { in: numericIds }
      }
    });

    // Log the deletion action
    try {
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: `Admin deleted ${deleteResult.count} notifications`,
          source: 'NOTIFICATION_MANAGEMENT',
          timestamp: new Date()
        }
      });
    } catch (logError) {
      console.error('Failed to log notification deletion:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} notifications deleted successfully`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
