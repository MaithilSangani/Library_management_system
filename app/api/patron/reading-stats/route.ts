import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to get user from token
function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : 
                request.cookies.get('auth-token')?.value || 
                request.headers.get('x-auth-token');

  if (!token) {
    // For demo purposes, return a mock user if no token
    return { patronId: 1, email: 'demo@example.com' };
  }

  try {
    // In production, verify with your JWT secret
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // For now, return mock user
    return { patronId: 1, email: 'demo@example.com' };
  } catch (error) {
    return null;
  }
}

// GET /api/patron/reading-stats - Get patron's reading statistics
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    // Get all completed borrowings for the patron
    const completedBorrowings = await prisma.transaction.findMany({
      where: {
        patronId: user.patronId,
        returnedAt: { not: null }
      },
      include: {
        item: {
          select: {
            subject: true
          }
        }
      },
      orderBy: {
        returnedAt: 'desc'
      }
    });

    // Calculate statistics
    const totalBooksRead = completedBorrowings.length;
    const booksThisYear = completedBorrowings.filter(b => 
      new Date(b.returnedAt!).getFullYear() === thisYear
    ).length;
    const booksThisMonth = completedBorrowings.filter(b => {
      const returnDate = new Date(b.returnedAt!);
      return returnDate.getFullYear() === thisYear && returnDate.getMonth() === thisMonth;
    }).length;

    // Calculate total reading days
    const totalReadingDays = completedBorrowings.reduce((total, borrowing) => {
      const borrowedDate = new Date(borrowing.borrowedAt);
      const returnedDate = new Date(borrowing.returnedAt!);
      const daysDiff = Math.ceil((returnedDate.getTime() - borrowedDate.getTime()) / (1000 * 60 * 60 * 24));
      return total + daysDiff;
    }, 0);

    // Calculate genre breakdown and favorite genre
    const genreCount: { [key: string]: number } = {};
    completedBorrowings.forEach(borrowing => {
      const genre = borrowing.item.subject || 'Other';
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    const favoriteGenre = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    // Calculate average rating
    const ratingsSum = completedBorrowings
      .filter(b => b.rating !== null)
      .reduce((sum, b) => sum + (b.rating || 0), 0);
    const ratedBooksCount = completedBorrowings.filter(b => b.rating !== null).length;
    const averageRating = ratedBooksCount > 0 ? ratingsSum / ratedBooksCount : 0;

    // Calculate reading streaks (simplified version)
    // For a more accurate streak, you'd need to check consecutive days
    let longestReadingStreak = 0;
    let currentReadingStreak = 0;
    
    if (completedBorrowings.length > 0) {
      // Sort by return date
      const sortedBorrowings = [...completedBorrowings].sort((a, b) => 
        new Date(a.returnedAt!).getTime() - new Date(b.returnedAt!).getTime()
      );
      
      // Simple streak calculation based on books returned within 30 days of each other
      let currentStreak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < sortedBorrowings.length; i++) {
        const prevDate = new Date(sortedBorrowings[i-1].returnedAt!);
        const currDate = new Date(sortedBorrowings[i].returnedAt!);
        const daysDiff = Math.ceil((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 30) { // Within 30 days = continuing streak
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      
      longestReadingStreak = maxStreak;
      
      // Check if current streak is still active (last book returned within 30 days)
      const lastReturnDate = new Date(sortedBorrowings[sortedBorrowings.length - 1].returnedAt!);
      const daysSinceLastReturn = Math.ceil((now.getTime() - lastReturnDate.getTime()) / (1000 * 60 * 60 * 24));
      currentReadingStreak = daysSinceLastReturn <= 30 ? currentStreak : 0;
    }

    // Generate monthly stats for the last 12 months
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const booksInMonth = completedBorrowings.filter(b => {
        const returnDate = new Date(b.returnedAt!);
        return returnDate.getFullYear() === date.getFullYear() && 
               returnDate.getMonth() === date.getMonth();
      }).length;
      
      monthlyStats.push({
        month: monthName,
        booksRead: booksInMonth
      });
    }

    const stats = {
      totalBooksRead,
      totalReadingDays,
      favoriteGenre,
      averageRating: Math.round(averageRating * 10) / 10,
      booksThisYear,
      booksThisMonth,
      longestReadingStreak,
      currentReadingStreak,
      genreBreakdown: genreCount,
      monthlyStats
    };

    return NextResponse.json(stats, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading statistics' },
      { status: 500 }
    );
  }
}
