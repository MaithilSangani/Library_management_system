import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get current date info for filtering
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all required statistics in parallel for better performance
    const [
      // Books statistics
      totalBooks,
      availableBooks,
      borrowedBooks,
      booksAddedThisWeek,
      
      // Patron statistics  
      totalPatrons,
      activePatrons,
      newPatronsThisWeek,
      
      // Transaction statistics
      overdueTransactions,
      overdueCount,
      todayIssued,
      todayReturned,
      
      // Recent activity
      recentTransactions,
      recentBooks,
      recentPatrons,
      
      // Popular books (most reserved)
      popularBooks,
      
      // Today's summary
      todayStats
    ] = await Promise.all([
      // Books
      prisma.item.aggregate({
        where: { isVisible: true },
        _sum: { totalCopies: true }
      }),
      
      prisma.item.aggregate({
        where: { isVisible: true },
        _sum: { availableCopies: true }
      }),
      
      prisma.transaction.count({
        where: { isReturned: false }
      }),
      
      prisma.item.count({
        where: {
          isVisible: true,
          createdAt: { gte: startOfWeek }
        }
      }),
      
      // Patrons
      prisma.patron.count(),
      
      prisma.patron.count({
        where: {
          transaction: {
            some: {
              isReturned: false
            }
          }
        }
      }),
      
      prisma.patron.count({
        where: {
          patronCreatedAt: { gte: startOfWeek }
        }
      }),
      
      // Overdue
      prisma.transaction.findMany({
        where: {
          isReturned: false,
          dueDate: { lt: now }
        },
        include: {
          item: { select: { title: true, author: true } },
          patron: { select: { patronFirstName: true, patronLastName: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: 10
      }),
      
      prisma.transaction.count({
        where: {
          isReturned: false,
          dueDate: { lt: now }
        }
      }),
      
      // Today's stats
      prisma.transaction.count({
        where: {
          borrowedAt: { gte: startOfToday, lt: endOfToday }
        }
      }),
      
      prisma.transaction.count({
        where: {
          isReturned: true,
          returnedAt: { gte: startOfToday, lt: endOfToday }
        }
      }),
      
      // Recent activity
      prisma.transaction.findMany({
        where: {
          OR: [
            { borrowedAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) } },
            { 
              isReturned: true,
              returnedAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
            }
          ]
        },
        include: {
          item: { select: { title: true, author: true } },
          patron: { select: { patronFirstName: true, patronLastName: true } }
        },
        orderBy: [
          { returnedAt: 'desc' },
          { borrowedAt: 'desc' }
        ],
        take: 10
      }),
      
      prisma.item.findMany({
        where: {
          isVisible: true,
          createdAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
        },
        select: { title: true, author: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      prisma.patron.findMany({
        where: {
          patronCreatedAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
        },
        select: { patronFirstName: true, patronLastName: true, patronCreatedAt: true },
        orderBy: { patronCreatedAt: 'desc' },
        take: 5
      }),
      
      // Popular books (most reserved)
      prisma.reservation.groupBy({
        by: ['itemId'],
        _count: { itemId: true },
        orderBy: { _count: { itemId: 'desc' } },
        take: 5
      }).then(async (reservations) => {
        const itemIds = reservations.map(r => r.itemId);
        const items = await prisma.item.findMany({
          where: { itemId: { in: itemIds } },
          select: { itemId: true, title: true, author: true, availableCopies: true }
        });
        
        return reservations.map(r => {
          const item = items.find(i => i.itemId === r.itemId);
          return {
            book: item?.title || 'Unknown',
            author: item?.author || 'Unknown',
            requests: r._count.itemId,
            available: item?.availableCopies || 0
          };
        });
      }),
      
      // Today's detailed stats
      Promise.all([
        // Books issued today
        prisma.transaction.count({
          where: { borrowedAt: { gte: startOfToday, lt: endOfToday } }
        }),
        // Books returned today  
        prisma.transaction.count({
          where: {
            isReturned: true,
            returnedAt: { gte: startOfToday, lt: endOfToday }
          }
        }),
        // New patrons today
        prisma.patron.count({
          where: { patronCreatedAt: { gte: startOfToday, lt: endOfToday } }
        }),
        // New books added today
        prisma.item.count({
          where: {
            isVisible: true,
            createdAt: { gte: startOfToday, lt: endOfToday }
          }
        })
      ])
    ]);

    // Calculate derived statistics
    const totalBooksCount = totalBooks._sum.totalCopies || 0;
    const availableBooksCount = availableBooks._sum.availableCopies || 0;
    const borrowedBooksCount = borrowedBooks;

    // Format overdue items with days overdue
    const overdueItems = overdueTransactions.map(transaction => {
      const daysOverdue = Math.ceil((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        book: transaction.item.title,
        author: transaction.item.author,
        patron: `${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`,
        days: daysOverdue,
        dueDate: transaction.dueDate
      };
    });

    // Format recent activity
    const recentActivity = [];
    
    // Add recent transactions
    recentTransactions.forEach(transaction => {
      if (transaction.isReturned && transaction.returnedAt) {
        recentActivity.push({
          type: 'return',
          message: `Book returned: "${transaction.item.title}"`,
          details: `by ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`,
          time: transaction.returnedAt,
          color: 'green'
        });
      } else {
        recentActivity.push({
          type: 'issue',
          message: `Book issued: "${transaction.item.title}"`,
          details: `to ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`,
          time: transaction.borrowedAt,
          color: 'orange'
        });
      }
    });
    
    // Add recent books
    recentBooks.forEach(book => {
      recentActivity.push({
        type: 'book_added',
        message: `New book added: "${book.title}"`,
        details: `by ${book.author}`,
        time: book.createdAt,
        color: 'blue'
      });
    });
    
    // Add recent patrons
    recentPatrons.forEach(patron => {
      recentActivity.push({
        type: 'patron_registered',
        message: 'New patron registered',
        details: `${patron.patronFirstName} ${patron.patronLastName}`,
        time: patron.patronCreatedAt,
        color: 'purple'
      });
    });
    
    // Sort by time and take most recent
    recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const formattedRecentActivity = recentActivity.slice(0, 10).map(activity => ({
      ...activity,
      timeAgo: getTimeAgo(new Date(activity.time))
    }));

    // Prepare response data
    const dashboardData = {
      stats: {
        totalBooks: totalBooksCount,
        availableBooks: availableBooksCount, 
        borrowedBooks: borrowedBooksCount,
        activePatrons: activePatrons,
        totalPatrons: totalPatrons,
        overdueBooks: overdueCount,
        booksAddedThisWeek: booksAddedThisWeek,
        newPatronsThisWeek: newPatronsThisWeek
      },
      overdueItems: overdueItems.slice(0, 4), // Limit to 4 for UI
      popularBooks: popularBooks.slice(0, 4), // Limit to 4 for UI
      recentActivity: formattedRecentActivity.slice(0, 4), // Limit to 4 for UI
      todaySummary: {
        booksIssued: todayStats[0],
        booksReturned: todayStats[1], 
        newRegistrations: todayStats[2],
        booksAdded: todayStats[3]
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}
