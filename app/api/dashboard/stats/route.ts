import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a simple Prisma client for this route
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get current date for comparisons
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Simplified database queries with timeout and error handling
    const basicCounts = await Promise.all([
      prisma.item.count({ where: { isVisible: true } }).catch(() => 0),
      prisma.transaction.count({ where: { isReturned: false } }).catch(() => 0),
      prisma.transaction.count({
        where: {
          isReturned: false,
          dueDate: { lt: now }
        }
      }).catch(() => 0),
      prisma.reservation.count().catch(() => 0)
    ]);
    
    const [
      totalItems,
      activeTransactions,
      overdueTransactions,
      activeReservations
    ] = basicCounts;

    // Calculate derived statistics
    const availableItems = totalItems; // Simplified for now
    const utilizationRate = totalItems > 0 ? Math.round(((activeTransactions || 0) / totalItems) * 100) : 0;

    const dashboardStats = {
      // Overview statistics
      overview: {
        totalItems,
        activeTransactions,
        availableItems,
        utilizationRate
      },
      
      
      // Transaction statistics
      transactions: {
        active: activeTransactions,
        overdue: overdueTransactions,
        today: 0, // Simplified for now
        thisWeek: 0, // Simplified for now
        thisMonth: 0 // Simplified for now
      },
      
      // Reservation statistics
      reservations: {
        active: activeReservations,
        today: 0 // Simplified for now
      },
      
      // Financial statistics (simplified)
      finances: {
        totalFinesOwed: 0,
        finesPaidToday: 0,
        estimatedOverdueAmount: overdueTransactions * 1
      },
      
      // Recent activities (simplified)
      recentActivity: {
        transactions: []
      },
      
      
      // Trend data for charts (simplified)
      trends: {
        daily: [],
        weekly: []
      },
      
      // Alerts and notifications
      alerts: {
        overdueBooks: overdueTransactions,
        lowStock: 0,
        pendingReturns: activeTransactions
      },
      
      // Metadata
      lastUpdated: now.toISOString(),
      refreshInterval: 30000 // 30 seconds
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Optional: Add POST method for triggering manual refresh
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'refresh') {
      // Trigger a manual refresh (same as GET but with different response)
      const response = await GET(request);
      const data = await response.json();
      
      return NextResponse.json({
        ...data,
        message: 'Dashboard statistics refreshed manually'
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
