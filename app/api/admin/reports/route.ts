import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { reportType, dateRange } = await request.json();
    
    // Parse date range
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

    switch (reportType) {
      case 'overview':
        return await getOverviewReport(startDate, endDate);
      
      case 'transactions':
        return await getTransactionReport(startDate, endDate);
      
      case 'users':
        return await getUserReport(startDate, endDate);
      
      case 'books':
        return await getBookReport(startDate, endDate);
      
      case 'financials':
        return await getFinancialReport(startDate, endDate);
      
      case 'trends':
        return await getTrendsReport(startDate, endDate);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Overview Report - Key metrics and summary
async function getOverviewReport(startDate: Date, endDate: Date) {
  const [
    totalUsers,
    totalBooks,
    activeTransactions,
    completedTransactions,
    overdueBooks,
    totalFines,
    paidFines,
    pendingRequests,
    newUsersInPeriod,
    transactionsInPeriod
  ] = await Promise.all([
    // Total users across all tables
    Promise.all([
      prisma.admin.count(),
      prisma.librarian.count(),
      prisma.patron.count()
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
    
    // Total books
    prisma.item.count(),
    
    // Active transactions (not returned)
    prisma.transaction.count({
      where: { isReturned: false }
    }),
    
    // Completed transactions in period
    prisma.transaction.count({
      where: {
        isReturned: true,
        returnedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    
    // Overdue books
    prisma.transaction.count({
      where: {
        isReturned: false,
        dueDate: { lt: new Date() }
      }
    }),
    
    // Total fines
    prisma.payment.aggregate({
      where: { paymentType: 'FINE' },
      _sum: { amount: true }
    }).then(result => result._sum.amount || 0),
    
    // Paid fines in period
    prisma.payment.aggregate({
      where: {
        paymentType: 'FINE',
        paymentStatus: 'PAID',
        paidDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    }).then(result => result._sum.amount || 0),
    
    // Pending requests
    prisma.borrowrequest.count({
      where: { status: 'PENDING' }
    }),
    
    // New users in period
    prisma.patron.count({
      where: {
        patronCreatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    
    // Transactions in period
    prisma.transaction.count({
      where: {
        borrowedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  ]);

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalBooks,
        activeTransactions,
        completedTransactions,
        overdueBooks,
        totalFines: Number(totalFines.toFixed(2)),
        paidFines: Number(paidFines.toFixed(2)),
        pendingRequests,
        newUsersInPeriod,
        transactionsInPeriod,
        overdueRate: activeTransactions > 0 ? ((overdueBooks / activeTransactions) * 100).toFixed(1) : '0',
        collectionRate: totalFines > 0 ? ((Number(paidFines) / Number(totalFines)) * 100).toFixed(1) : '0'
      }
    }
  });
}

// Transaction Report - Borrowing patterns and statistics
async function getTransactionReport(startDate: Date, endDate: Date) {
  const [
    transactionsByMonth,
    transactionsByStatus,
    topBorrowedBooks,
    averageLoanDuration,
    returnRates
  ] = await Promise.all([
    // Transactions by month
    prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(borrowedAt, '%Y-%m') as month,
        COUNT(*) as count
      FROM transaction
      WHERE borrowedAt >= ${startDate} AND borrowedAt <= ${endDate}
      GROUP BY DATE_FORMAT(borrowedAt, '%Y-%m')
      ORDER BY month
    `,
    
    // Transactions by status
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN isReturned = true THEN 'Returned'
          WHEN dueDate < NOW() THEN 'Overdue'
          ELSE 'Active'
        END as status,
        COUNT(*) as count
      FROM transaction
      WHERE borrowedAt >= ${startDate} AND borrowedAt <= ${endDate}
      GROUP BY status
    `,
    
    // Top borrowed books
    prisma.$queryRaw`
      SELECT 
        i.title,
        i.author,
        COUNT(*) as borrowCount
      FROM transaction t
      JOIN item i ON t.itemId = i.itemId
      WHERE t.borrowedAt >= ${startDate} AND t.borrowedAt <= ${endDate}
      GROUP BY t.itemId, i.title, i.author
      ORDER BY borrowCount DESC
      LIMIT 10
    `,
    
    // Average loan duration for returned books
    prisma.$queryRaw`
      SELECT AVG(DATEDIFF(returnedAt, borrowedAt)) as avgDays
      FROM transaction
      WHERE isReturned = true 
        AND returnedAt >= ${startDate} 
        AND returnedAt <= ${endDate}
    `,
    
    // Return rates
    prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN isReturned = true THEN 1 END) as returned,
        COUNT(CASE WHEN isReturned = false AND dueDate >= NOW() THEN 1 END) as active,
        COUNT(CASE WHEN isReturned = false AND dueDate < NOW() THEN 1 END) as overdue,
        COUNT(*) as total
      FROM transaction
      WHERE borrowedAt >= ${startDate} AND borrowedAt <= ${endDate}
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      transactionsByMonth,
      transactionsByStatus,
      topBorrowedBooks,
      averageLoanDuration: averageLoanDuration[0]?.avgDays || 0,
      returnRates: returnRates[0] || {}
    }
  });
}

// User Report - User statistics and demographics
async function getUserReport(startDate: Date, endDate: Date) {
  const [
    userGrowth,
    usersByType,
    activePatrons,
    topPatrons,
    studentVsFaculty
  ] = await Promise.all([
    // User registration growth
    prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(patronCreatedAt, '%Y-%m') as month,
        COUNT(*) as count
      FROM patron
      WHERE patronCreatedAt >= ${startDate} AND patronCreatedAt <= ${endDate}
      GROUP BY DATE_FORMAT(patronCreatedAt, '%Y-%m')
      ORDER BY month
    `,
    
    // Users by type
    Promise.all([
      prisma.admin.count(),
      prisma.librarian.count(),
      prisma.patron.count()
    ]).then(([adminCount, librarianCount, patronCount]) => ({
      admin: adminCount,
      librarian: librarianCount,
      patron: patronCount
    })),
    
    // Active patrons (those with transactions in period)
    prisma.$queryRaw`
      SELECT DISTINCT patronId
      FROM transaction
      WHERE borrowedAt >= ${startDate} AND borrowedAt <= ${endDate}
    `,
    
    // Top patrons by activity
    prisma.$queryRaw`
      SELECT 
        CONCAT(p.patronFirstName, ' ', p.patronLastName) as name,
        p.patronEmail as email,
        COUNT(*) as transactionCount
      FROM transaction t
      JOIN patron p ON t.patronId = p.patronId
      WHERE t.borrowedAt >= ${startDate} AND t.borrowedAt <= ${endDate}
      GROUP BY t.patronId, p.patronFirstName, p.patronLastName, p.patronEmail
      ORDER BY transactionCount DESC
      LIMIT 10
    `,
    
    // Student vs Faculty breakdown
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN isStudent = true THEN 'Student'
          WHEN isFaculty = true THEN 'Faculty'
          ELSE 'Other'
        END as type,
        COUNT(*) as count
      FROM patron
      GROUP BY type
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      userGrowth,
      usersByType,
      activePatronsCount: activePatrons.length,
      topPatrons,
      studentVsFaculty
    }
  });
}

// Book Report - Collection analysis and utilization
async function getBookReport(startDate: Date, endDate: Date) {
  const [
    booksByCategory,
    bookUtilization,
    topAuthors,
    collectionStats,
    borrowingTrends
  ] = await Promise.all([
    // Books by item type
    prisma.item.groupBy({
      by: ['itemType'],
      _count: { itemId: true }
    }),
    
    // Book utilization (books with transactions vs total)
    prisma.$queryRaw`
      SELECT 
        i.itemId,
        i.title,
        i.author,
        COUNT(t.transactionId) as borrowCount,
        i.totalCopies,
        i.availableCopies
      FROM item i
      LEFT JOIN transaction t ON i.itemId = t.itemId 
        AND t.borrowedAt >= ${startDate} 
        AND t.borrowedAt <= ${endDate}
      GROUP BY i.itemId, i.title, i.author, i.totalCopies, i.availableCopies
      ORDER BY borrowCount DESC
      LIMIT 20
    `,
    
    // Top authors by popularity
    prisma.$queryRaw`
      SELECT 
        i.author,
        COUNT(t.transactionId) as borrowCount,
        COUNT(DISTINCT i.itemId) as bookCount
      FROM item i
      LEFT JOIN transaction t ON i.itemId = t.itemId
        AND t.borrowedAt >= ${startDate} 
        AND t.borrowedAt <= ${endDate}
      WHERE i.author IS NOT NULL AND i.author != ''
      GROUP BY i.author
      HAVING borrowCount > 0
      ORDER BY borrowCount DESC
      LIMIT 10
    `,
    
    // Collection statistics
    prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalBooks,
        SUM(totalCopies) as totalCopies,
        SUM(availableCopies) as availableCopies,
        AVG(price) as averagePrice
      FROM item
    `,
    
    // Borrowing trends by item type
    prisma.$queryRaw`
      SELECT 
        i.itemType,
        COUNT(t.transactionId) as borrowCount
      FROM transaction t
      JOIN item i ON t.itemId = i.itemId
      WHERE t.borrowedAt >= ${startDate} AND t.borrowedAt <= ${endDate}
      GROUP BY i.itemType
      ORDER BY borrowCount DESC
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      booksByCategory: booksByCategory.map(item => ({
        category: item.itemType,
        count: item._count.itemId
      })),
      bookUtilization,
      topAuthors,
      collectionStats: collectionStats[0] || {},
      borrowingTrends
    }
  });
}

// Financial Report - Revenue and payment analysis
async function getFinancialReport(startDate: Date, endDate: Date) {
  const [
    revenueByMonth,
    paymentsByType,
    fineCollection,
    outstandingPayments,
    paymentMethods
  ] = await Promise.all([
    // Revenue by month
    prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(paidDate, '%Y-%m') as month,
        SUM(amount) as revenue
      FROM payment
      WHERE paymentStatus = 'PAID' 
        AND paidDate >= ${startDate} 
        AND paidDate <= ${endDate}
      GROUP BY DATE_FORMAT(paidDate, '%Y-%m')
      ORDER BY month
    `,
    
    // Payments by type
    prisma.payment.groupBy({
      by: ['paymentType'],
      where: {
        paymentStatus: 'PAID',
        paidDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true },
      _count: { paymentId: true }
    }),
    
    // Fine collection efficiency
    prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN paymentStatus = 'PAID' THEN amount ELSE 0 END) as collected,
        SUM(amount) as total,
        COUNT(CASE WHEN paymentStatus = 'PAID' THEN 1 END) as paidCount,
        COUNT(*) as totalCount
      FROM payment
      WHERE paymentType = 'FINE'
        AND createdAt >= ${startDate}
        AND createdAt <= ${endDate}
    `,
    
    // Outstanding payments
    prisma.payment.aggregate({
      where: {
        paymentStatus: { in: ['PENDING', 'OVERDUE'] }
      },
      _sum: { amount: true },
      _count: { paymentId: true }
    }),
    
    // Payment methods
    prisma.$queryRaw`
      SELECT 
        paymentMethod,
        COUNT(*) as count,
        SUM(amount) as total
      FROM payment
      WHERE paymentStatus = 'PAID'
        AND paidDate >= ${startDate}
        AND paidDate <= ${endDate}
        AND paymentMethod IS NOT NULL
      GROUP BY paymentMethod
      ORDER BY total DESC
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      revenueByMonth,
      paymentsByType: paymentsByType.map(item => ({
        type: item.paymentType,
        amount: item._sum.amount || 0,
        count: item._count.paymentId
      })),
      fineCollection: fineCollection[0] || {},
      outstandingPayments: {
        amount: outstandingPayments._sum.amount || 0,
        count: outstandingPayments._count.paymentId
      },
      paymentMethods
    }
  });
}

// Trends Report - Analytics and predictions
async function getTrendsReport(startDate: Date, endDate: Date) {
  const [
    dailyActivity,
    popularTimes,
    seasonalTrends,
    growthMetrics
  ] = await Promise.all([
    // Daily activity over the period
    prisma.$queryRaw`
      SELECT 
        DATE(borrowedAt) as date,
        COUNT(*) as transactions
      FROM transaction
      WHERE borrowedAt >= ${startDate} AND borrowedAt <= ${endDate}
      GROUP BY DATE(borrowedAt)
      ORDER BY date
    `,
    
    // Popular borrowing times
    prisma.$queryRaw`
      SELECT 
        HOUR(borrowedAt) as hour,
        COUNT(*) as count
      FROM transaction
      WHERE borrowedAt >= ${startDate} AND borrowedAt <= ${endDate}
      GROUP BY HOUR(borrowedAt)
      ORDER BY hour
    `,
    
    // Seasonal trends by month
    prisma.$queryRaw`
      SELECT 
        MONTH(borrowedAt) as month,
        COUNT(*) as count,
        AVG(COUNT(*)) OVER () as average
      FROM transaction
      WHERE YEAR(borrowedAt) >= YEAR(${startDate})
      GROUP BY MONTH(borrowedAt)
      ORDER BY month
    `,
    
    // Growth metrics
    prisma.$queryRaw`
      SELECT 
        'users' as metric,
        COUNT(*) as current_period
      FROM patron
      WHERE patronCreatedAt >= ${startDate} AND patronCreatedAt <= ${endDate}
      UNION ALL
      SELECT 
        'transactions' as metric,
        COUNT(*) as current_period
      FROM transaction
      WHERE borrowedAt >= ${startDate} AND borrowedAt <= ${endDate}
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      dailyActivity,
      popularTimes,
      seasonalTrends,
      growthMetrics
    }
  });
}
