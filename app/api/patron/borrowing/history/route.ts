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

// GET /api/patron/borrowing/history - Get patron's borrowing history
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all transactions (both completed and current) for the patron
    const transactions = await prisma.transaction.findMany({
      where: {
        patronId: user.patronId
      },
      include: {
        item: {
          select: {
            itemId: true,
            title: true,
            author: true,
            isbn: true,
            subject: true,
            itemType: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        borrowedAt: 'desc'
      }
    });

    // Transform the data to match the frontend interface
    const borrowingHistory = transactions.map(transaction => {
      const borrowedDate = new Date(transaction.borrowedAt);
      const dueDate = new Date(transaction.dueDate);
      const returnDate = transaction.returnedAt ? new Date(transaction.returnedAt) : null;
      const now = new Date();
      
      // Calculate if it was overdue
      let wasOverdue = false;
      let overdueDays = 0;
      
      if (returnDate) {
        // Book was returned - check if it was overdue
        if (returnDate > dueDate) {
          wasOverdue = true;
          overdueDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      } else {
        // Book is still borrowed - check if it's currently overdue
        if (now > dueDate) {
          wasOverdue = true;
          overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        borrowingId: transaction.transactionId,
        borrowedAt: transaction.borrowedAt.toISOString(),
        dueDate: transaction.dueDate.toISOString(),
        returnedAt: transaction.returnedAt?.toISOString(),
        renewalCount: transaction.renewalCount,
        wasOverdue,
        overdueDays: wasOverdue ? overdueDays : undefined,
        fineAmount: transaction.finePaid,
        rating: transaction.rating,
        review: transaction.review,
        item: {
          itemId: transaction.item.itemId,
          title: transaction.item.title,
          author: transaction.item.author,
          isbn: transaction.item.isbn,
          subject: transaction.item.subject,
          itemType: transaction.item.itemType,
          imageUrl: transaction.item.imageUrl
        }
      };
    });

    return NextResponse.json(borrowingHistory, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching borrowing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrowing history' },
      { status: 500 }
    );
  }
}
