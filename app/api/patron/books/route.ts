import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch patron's borrowed books
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patronId = searchParams.get('patronId');
    const includeHistory = searchParams.get('includeHistory') === 'true';

    if (!patronId) {
      return NextResponse.json(
        { error: 'Patron ID is required' },
        { status: 400 }
      );
    }

    // Base where clause for transactions
    let whereClause: any = {
      patronId: parseInt(patronId)
    };

    // If not including history, only get active loans
    if (!includeHistory) {
      whereClause.isReturned = false;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        item: {
          select: {
            itemId: true,
            title: true,
            author: true,
            isbn: true,
            subject: true,
            itemType: true,
            condition: true,
            imageUrl: true
          }
        }
      },
      orderBy: [
        { isReturned: 'asc' }, // Active loans first
        { borrowedAt: 'desc' }
      ]
    });

    // Calculate additional information for each transaction
    const transactionsWithDetails = transactions.map(transaction => {
      const today = new Date();
      const dueDate = new Date(transaction.dueDate);
      
      let status = 'active';
      let daysOverdue = 0;
      let fine = 0;
      
      if (transaction.isReturned) {
        status = 'returned';
      } else if (dueDate < today) {
        status = 'overdue';
        daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        // Simple fine calculation - can be made configurable
        fine = daysOverdue * 1; // $1 per day
      }

      return {
        ...transaction,
        status,
        daysOverdue,
        fine,
        dueDate: transaction.dueDate.toISOString(),
        borrowedAt: transaction.borrowedAt.toISOString(),
        returnedAt: transaction.returnedAt?.toISOString() || null
      };
    });

    // Separate current loans and history
    const currentLoans = transactionsWithDetails.filter(t => !t.isReturned);
    const history = transactionsWithDetails.filter(t => t.isReturned);

    // Calculate statistics
    const stats = {
      totalBorrowed: currentLoans.length,
      overdueBooks: currentLoans.filter(t => t.status === 'overdue').length,
      totalFines: currentLoans.reduce((sum, t) => sum + (t.fine || 0), 0),
      booksRead: history.length,
      currentBorrowingLimit: 5 // Can be fetched from library settings
    };

    return NextResponse.json({
      currentLoans,
      history: includeHistory ? history : [],
      stats,
      success: true
    });
  } catch (error) {
    console.error('Error fetching patron books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your books' },
      { status: 500 }
    );
  }
}

// PUT: Renew a book
export async function PUT(request: NextRequest) {
  try {
    const { transactionId, patronId } = await request.json();

    if (!transactionId || !patronId) {
      return NextResponse.json(
        { error: 'Transaction ID and Patron ID are required' },
        { status: 400 }
      );
    }

    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        transactionId: parseInt(transactionId),
        patronId: parseInt(patronId),
        isReturned: false
      },
      include: {
        item: {
          select: {
            title: true,
            author: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found or book already returned' },
        { status: 404 }
      );
    }

    // Check if book is overdue (you may want to restrict renewals for overdue books)
    const today = new Date();
    const isOverdue = new Date(transaction.dueDate) < today;

    if (isOverdue) {
      return NextResponse.json(
        { error: 'Cannot renew overdue books. Please return the book first.' },
        { status: 400 }
      );
    }

    // Get library settings for loan period
    const librarySettings = await prisma.librarysettings.findFirst();
    const loanPeriodDays = librarySettings?.loanPeriodDays || 14;

    // Calculate new due date (extend from current due date, not today)
    const newDueDate = new Date(transaction.dueDate);
    newDueDate.setDate(newDueDate.getDate() + loanPeriodDays);

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { transactionId: parseInt(transactionId) },
      data: { dueDate: newDueDate },
      include: {
        item: {
          select: {
            title: true,
            author: true,
            isbn: true
          }
        }
      }
    });

    // Create status history entry
    await prisma.itemstatushistory.create({
      data: {
        itemId: transaction.itemId,
        status: 'BORROWED',
        previousStatus: 'BORROWED',
        reason: 'Book renewed by patron',
        changedBy: `patron:${patronId}`,
        notes: `Book renewed until ${newDueDate.toISOString().split('T')[0]}`
      }
    });

    return NextResponse.json({
      message: 'Book renewed successfully!',
      transaction: {
        ...updatedTransaction,
        dueDate: newDueDate.toISOString()
      },
      newDueDate: newDueDate.toISOString()
    });
  } catch (error) {
    console.error('Error renewing book:', error);
    return NextResponse.json(
      { error: 'Failed to renew book' },
      { status: 500 }
    );
  }
}
