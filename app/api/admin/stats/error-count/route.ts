import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Since we don't have an error logging table yet, we'll simulate error tracking
    // In a real implementation, you'd have an error_logs table
    
    // For now, we'll count recent failed transactions or payment issues
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Count failed/cancelled payments as "errors"
    const paymentErrors = await prisma.payment.count({
      where: {
        paymentStatus: 'CANCELLED',
        updatedAt: {
          gte: twentyFourHoursAgo
        }
      }
    });

    // Count overdue items as "system issues"
    const overdueItems = await prisma.transaction.count({
      where: {
        isReturned: false,
        dueDate: {
          lt: new Date()
        }
      }
    });

    // Simulate some error categories for demonstration
    const errorCategories = {
      payment_failures: paymentErrors,
      overdue_items: overdueItems,
      system_errors: 0, // Would come from actual error logs
      api_errors: 0,    // Would come from API error tracking
      database_errors: 0 // Would come from database error logs
    };

    const totalErrors = Object.values(errorCategories).reduce((sum, count) => sum + count, 0);

    // Get error trend (compare with previous day)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const previousDayErrors = await prisma.payment.count({
      where: {
        paymentStatus: 'CANCELLED',
        updatedAt: {
          gte: fortyEightHoursAgo,
          lt: twentyFourHoursAgo
        }
      }
    });

    const trend = paymentErrors - previousDayErrors;

    const response = {
      errorCount: totalErrors,
      recentErrors: paymentErrors, // Errors in last 24 hours
      errorCategories,
      trend: {
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        change: Math.abs(trend),
        percentage: previousDayErrors > 0 ? Math.round((trend / previousDayErrors) * 100) : 0
      },
      timestamp: new Date().toISOString(),
      note: 'Currently tracking payment failures and overdue items. Full error logging coming soon.'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching error count statistics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch error statistics',
        errorCount: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
