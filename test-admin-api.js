const { NextRequest, NextResponse } = require('next/server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminDashboardAPI() {
  try {
    console.log('🔍 Testing Admin Dashboard API...\n');

    // Get current date for time-based calculations
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    console.log('📅 Date calculations:');
    console.log(`  - Now: ${now.toISOString()}`);
    console.log(`  - Start of day: ${startOfDay.toISOString()}`);
    console.log(`  - Start of week: ${startOfWeek.toISOString()}`);
    console.log(`  - Start of month: ${startOfMonth.toISOString()}\n`);

    // Test the same queries as in the API
    const [
      totalItems,
      totalPatrons,
      totalTransactions,
      activeTransactions,
      overdueTransactions,
      pendingBorrowRequests,
      activeReservations,
      todayTransactions,
      weeklyTransactions,
      monthlyTransactions,
      itemsByType,
      itemConditions
    ] = await Promise.all([
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
      prisma.item.groupBy({
        by: ['itemType'],
        _count: { itemType: true },
        where: { isVisible: true }
      }),
      prisma.item.groupBy({
        by: ['condition'],
        _count: { condition: true },
        where: { isVisible: true }
      })
    ]);

    console.log('📊 Dashboard Statistics:');
    console.log(`  📚 Total Items: ${totalItems}`);
    console.log(`  👥 Total Patrons: ${totalPatrons}`);
    console.log(`  📋 Total Transactions: ${totalTransactions}`);
    console.log(`  🔄 Active Transactions: ${activeTransactions}`);
    console.log(`  ⚠️  Overdue Transactions: ${overdueTransactions}`);
    console.log(`  📨 Pending Borrow Requests: ${pendingBorrowRequests}`);
    console.log(`  📅 Active Reservations: ${activeReservations}`);
    console.log(`  📈 Today's Transactions: ${todayTransactions}`);
    console.log(`  📊 Weekly Transactions: ${weeklyTransactions}`);
    console.log(`  📉 Monthly Transactions: ${monthlyTransactions}\n`);

    // Calculate derived statistics
    const availableItems = totalItems - activeTransactions;
    const utilizationRate = totalItems > 0 ? Math.round((activeTransactions / totalItems) * 100) : 0;
    const returnRate = totalTransactions > 0 ? Math.round(((totalTransactions - activeTransactions) / totalTransactions) * 100) : 0;

    console.log('🧮 Calculated Metrics:');
    console.log(`  ✅ Available Items: ${availableItems}`);
    console.log(`  📊 Utilization Rate: ${utilizationRate}%`);
    console.log(`  🔄 Return Rate: ${returnRate}%\n`);

    console.log('📊 Collection Distribution:');
    console.log('  Items by Type:');
    itemsByType.forEach(type => {
      console.log(`    - ${type.itemType}: ${type._count.itemType}`);
    });

    console.log('\n  Items by Condition:');
    itemConditions.forEach(cond => {
      console.log(`    - ${cond.condition}: ${cond._count.condition}`);
    });

    // Test most borrowed items query
    const mostBorrowedQuery = await prisma.transaction.groupBy({
      by: ['itemId'],
      _count: { itemId: true },
      orderBy: { _count: { itemId: 'desc' } },
      take: 5
    });

    if (mostBorrowedQuery.length > 0) {
      const itemIds = mostBorrowedQuery.map(r => r.itemId);
      const items = await prisma.item.findMany({
        where: { itemId: { in: itemIds } },
        select: { itemId: true, title: true, author: true }
      });

      console.log('\n🔥 Most Borrowed Items:');
      mostBorrowedQuery.forEach(borrowed => {
        const item = items.find(i => i.itemId === borrowed.itemId);
        console.log(`    - "${item?.title || 'Unknown'}" by ${item?.author || 'Unknown'}: ${borrowed._count.itemId} times`);
      });
    }

    // Generate trend data for the last 7 days
    console.log('\n📈 Daily Trend Data:');
    const trendPromises = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(startOfDay);
      date.setDate(startOfDay.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      trendPromises.push(
        Promise.all([
          prisma.transaction.count({
            where: {
              borrowedAt: { gte: date, lt: nextDate }
            }
          }),
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
    dailyTrends.forEach(trend => {
      console.log(`    ${trend.dayName} (${trend.date}): ${trend.borrowings} borrowings, ${trend.returns} returns`);
    });

    console.log('\n✅ Admin Dashboard API test completed successfully!');
    console.log('\n💡 The data is available and the queries are working. The issue might be in the frontend or API routing.');

  } catch (error) {
    console.error('❌ Error testing admin dashboard API:', error);
    console.log('\n🐛 Error details:');
    console.log('   - Message:', error.message);
    console.log('   - Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminDashboardAPI();
