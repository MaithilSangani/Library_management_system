import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get current date for time-based calculations
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Comprehensive database queries
    const [
      // Basic counts
      totalItems,
      totalPatrons,
      totalTransactions,
      activeTransactions,
      overdueTransactions,
      pendingBorrowRequests,
      activeReservations,
      
      // Recent data
      todayTransactions,
      weeklyTransactions,
      monthlyTransactions,
      recentBorrowRequests,
      
      // Financial data
      totalFines,
      paidFines,
      pendingPayments,
      
      // User activity
      newPatronsToday,
      newPatronsWeek,
      
      // Item statistics
      itemsByType,
      mostBorrowedItems,
      
      // System health data
      recentActivities,
      
      // Notifications
      unreadNotifications,
      
      // Item conditions
      itemConditions
    ] = await Promise.all([
      // Basic counts
      prisma.item.count({ where: { isVisible: true } }),
      prisma.patron.count(),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { isReturned: false } }),
      prisma.transaction.count({
        where: {
          isReturned: false,
          dueDate: { lt: now }
        }
      }),
      prisma.borrowrequest.count({ where: { status: 'PENDING' } }),
      prisma.reservation.count(),
      
      // Recent transactions
      prisma.transaction.count({
        where: {
          borrowedAt: { gte: startOfDay }
        }
      }),
      prisma.transaction.count({
        where: {
          borrowedAt: { gte: startOfWeek }
        }
      }),
      prisma.transaction.count({
        where: {
          borrowedAt: { gte: startOfMonth }
        }
      }),
      
      // Recent borrow requests
      prisma.borrowrequest.findMany({
        take: 10,
        orderBy: { requestedAt: 'desc' },
        include: {
          patron: { select: { patronFirstName: true, patronLastName: true } },
          item: { select: { title: true } }
        }
      }),
      
      // Financial data
      prisma.payment.aggregate({
        where: {
          paymentType: { in: ['FINE', 'LATE_FEE'] },
          paymentStatus: { in: ['PENDING', 'OVERDUE'] }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          paymentType: { in: ['FINE', 'LATE_FEE'] },
          paymentStatus: 'PAID'
        },
        _sum: { amount: true }
      }),
      prisma.payment.count({
        where: { paymentStatus: { in: ['PENDING', 'OVERDUE'] } }
      }),
      
      // User activity
      prisma.patron.count({
        where: {
          patronCreatedAt: { gte: startOfDay }
        }
      }),
      prisma.patron.count({
        where: {
          patronCreatedAt: { gte: startOfWeek }
        }
      }),
      
      // Item statistics
      prisma.item.groupBy({
        by: ['itemType'],
        _count: { itemType: true },
        where: { isVisible: true }
      }),
      
      prisma.transaction.groupBy({
        by: ['itemId'],
        _count: { itemId: true },
        orderBy: { _count: { itemId: 'desc' } },
        take: 5
      }).then(async (result) => {
        const itemIds = result.map(r => r.itemId);
        const items = await prisma.item.findMany({
          where: { itemId: { in: itemIds } },
          select: { itemId: true, title: true, author: true }
        });
        
        return result.map(r => ({
          ...r,
          item: items.find(i => i.itemId === r.itemId)
        }));
      }),
      
      // Recent activities (simplified)
      prisma.transaction.findMany({
        take: 10,
        orderBy: { borrowedAt: 'desc' },
        include: {
          patron: { select: { patronFirstName: true, patronLastName: true } },
          item: { select: { title: true } }
        }
      }),
      
      // Notifications
      prisma.notification.count({
        where: { status: 'UNREAD' }
      }),
      
      // Item conditions
      prisma.item.groupBy({
        by: ['condition'],
        _count: { condition: true },
        where: { isVisible: true }
      })
    ]);

    // Calculate derived statistics
    const availableItems = totalItems - activeTransactions;
    const utilizationRate = totalItems > 0 ? Math.round((activeTransactions / totalItems) * 100) : 0;
    const returnRate = totalTransactions > 0 ? Math.round(((totalTransactions - activeTransactions) / totalTransactions) * 100) : 0;

    // Generate trend data for the last 7 days with enhanced data
    const trendPromises = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(startOfDay);
      date.setDate(startOfDay.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      trendPromises.push(
        Promise.all([
          // Count borrowings
          prisma.transaction.count({
            where: {
              borrowedAt: { gte: date, lt: nextDate }
            }
          }),
          // Count returns
          prisma.transaction.count({
            where: {
              returnedAt: { gte: date, lt: nextDate }
            }
          })
        ]).then(([borrowings, returns]) => ({
          date: date.toISOString().split('T')[0],
          borrowings,
          returns,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
        }))
      );
    }
    
    const dailyTrends = await Promise.all(trendPromises);

    // Prepare dashboard data
    const dashboardData = {
      // Overview statistics
      overview: {
        totalItems,
        totalPatrons,
        activeTransactions,
        availableItems,
        utilizationRate,
        returnRate
      },
      
      // Transaction statistics
      transactions: {
        total: totalTransactions,
        active: activeTransactions,
        overdue: overdueTransactions,
        today: todayTransactions,
        thisWeek: weeklyTransactions,
        thisMonth: monthlyTransactions
      },
      
      // User statistics
      users: {
        total: totalPatrons,
        newToday: newPatronsToday,
        newThisWeek: newPatronsWeek,
        activeUsers: Math.max(weeklyTransactions, 1) // Approximation
      },
      
      // Requests and reservations
      requests: {
        pendingBorrows: pendingBorrowRequests,
        activeReservations,
        recentRequests: recentBorrowRequests.map(req => ({
          id: req.requestId,
          patron: `${req.patron.patronFirstName} ${req.patron.patronLastName}`,
          item: req.item.title,
          status: req.status,
          requestedAt: req.requestedAt,
          type: 'borrow_request'
        }))
      },
      
      // Financial statistics
      finances: {
        totalFinesOwed: totalFines._sum.amount || 0,
        finesPaid: paidFines._sum.amount || 0,
        pendingPayments: pendingPayments,
        estimatedOverdueAmount: overdueTransactions * 5 // Assuming $5 per overdue item
      },
      
      // Item analytics
      items: {
        byType: itemsByType.map(type => ({
          type: type.itemType,
          count: type._count.itemType
        })),
        byCondition: itemConditions.map(cond => ({
          condition: cond.condition,
          count: cond._count.condition
        })),
        mostBorrowed: mostBorrowedItems.map(item => ({
          title: item.item?.title || 'Unknown',
          author: item.item?.author || 'Unknown',
          borrowCount: item._count.itemId
        }))
      },
      
      // Recent activities
      recentActivity: recentActivities.map(activity => ({
        id: activity.transactionId,
        type: activity.isReturned ? 'return' : 'borrow',
        description: `${activity.patron.patronFirstName} ${activity.patron.patronLastName} ${activity.isReturned ? 'returned' : 'borrowed'} "${activity.item.title}"`,
        timestamp: activity.returnedAt || activity.borrowedAt,
        status: activity.isReturned ? 'completed' : (activity.dueDate < now ? 'overdue' : 'active')
      })),
      
      // Trend data
      trends: {
        daily: dailyTrends,
        weekly: [] // Can be implemented later
      },
      
      // Alerts and notifications
      alerts: {
        overdueBooks: overdueTransactions,
        pendingRequests: pendingBorrowRequests,
        unreadNotifications: unreadNotifications,
        lowStock: itemsByType.filter(type => type._count.itemType < 5).length,
        systemHealth: 'healthy' // Can be enhanced with actual health checks
      },
      
      // System status
      systemStatus: {
        databaseStatus: 'operational',
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        serverHealth: {
          cpu: Math.floor(Math.random() * 30) + 20, // Mock data
          memory: Math.floor(Math.random() * 40) + 30, // Mock data
          disk: Math.floor(Math.random() * 20) + 10 // Mock data
        }
      },
      
      // Metadata
      lastUpdated: now.toISOString(),
      refreshInterval: 30000 // 30 seconds
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch admin dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST method for manual refresh or specific actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'refresh':
        const response = await GET(request);
        const data = await response.json();
        return NextResponse.json({
          ...data,
          message: 'Admin dashboard refreshed successfully'
        });
      
      case 'export':
        // Export dashboard data as JSON
        const exportResponse = await GET(request);
        const exportData = await exportResponse.json();
        
        return NextResponse.json({
          success: true,
          data: exportData.data,
          exportedAt: new Date().toISOString(),
          message: 'Dashboard data exported successfully'
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process admin dashboard request' },
      { status: 500 }
    );
  }
}
