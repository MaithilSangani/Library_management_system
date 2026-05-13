import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch overdue transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const severity = searchParams.get('severity') || 'all';
    const offset = (page - 1) * limit;

    const now = new Date();
    
    // Build where clause for overdue transactions
    const whereClause: any = {
      isReturned: false,
      dueDate: {
        lt: now
      }
    };

    // Add search functionality
    if (search) {
      whereClause.OR = [
        {
          patron: {
            OR: [
              { patronFirstName: { contains: search } },
              { patronLastName: { contains: search } },
              { patronEmail: { contains: search } }
            ]
          }
        },
        {
          item: {
            OR: [
              { title: { contains: search } },
              { author: { contains: search } },
              { isbn: { contains: search } }
            ]
          }
        }
      ];
    }

    // Get overdue transactions with patron and item details
    const overdueTransactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        patron: {
          select: {
            patronId: true,
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true,
            isStudent: true,
            isFaculty: true,
            student: {
              select: {
                studentDepartment: true,
                studentSemester: true,
                studentRollNo: true,
                studentEnrollmentNumber: true
              }
            },
            faculty: {
              select: {
                facultyDepartment: true
              }
            }
          }
        },
        item: {
          select: {
            itemId: true,
            title: true,
            author: true,
            isbn: true,
            imageUrl: true,
            subject: true,
            itemType: true,
            condition: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Calculate days overdue and fine for each transaction
    const finePerDay = 1.0; // Should be fetched from library settings
    const processedTransactions = overdueTransactions.map(transaction => {
      const daysOverdue = Math.ceil((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * finePerDay;
      
      return {
        transactionId: transaction.transactionId,
        borrowedAt: transaction.borrowedAt.toISOString(),
        dueDate: transaction.dueDate.toISOString(),
        daysOverdue,
        fineAmount,
        finePaid: transaction.finePaid || 0,
        isReturned: transaction.isReturned,
        patron: {
          patronId: transaction.patron.patronId,
          patronFirstName: transaction.patron.patronFirstName,
          patronLastName: transaction.patron.patronLastName,
          patronEmail: transaction.patron.patronEmail,
          patronType: transaction.patron.isStudent ? 'Student' : (transaction.patron.isFaculty ? 'Faculty' : 'General'),
          details: transaction.patron.isStudent 
            ? `${transaction.patron.student?.studentDepartment || 'N/A'} - Sem ${transaction.patron.student?.studentSemester || 'N/A'}`
            : transaction.patron.isFaculty
              ? transaction.patron.faculty?.facultyDepartment || 'N/A'
              : 'General Member'
        },
        item: {
          itemId: transaction.item.itemId,
          title: transaction.item.title,
          author: transaction.item.author,
          isbn: transaction.item.isbn,
          imageUrl: transaction.item.imageUrl,
          subject: transaction.item.subject,
          itemType: transaction.item.itemType,
          condition: transaction.item.condition
        }
      };
    });

    // Apply severity filtering
    let filteredTransactions = processedTransactions;
    if (severity !== 'all') {
      filteredTransactions = processedTransactions.filter(t => {
        switch (severity) {
          case 'low': return t.daysOverdue <= 3;
          case 'medium': return t.daysOverdue > 3 && t.daysOverdue <= 7;
          case 'high': return t.daysOverdue > 7 && t.daysOverdue <= 14;
          case 'critical': return t.daysOverdue > 14;
          default: return true;
        }
      });
    }

    // Apply pagination
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);

    // Calculate statistics
    const totalOverdue = processedTransactions.length;
    const totalFineAmount = processedTransactions.reduce((sum, t) => sum + t.fineAmount, 0);
    const averageDaysOverdue = totalOverdue > 0 
      ? processedTransactions.reduce((sum, t) => sum + t.daysOverdue, 0) / totalOverdue
      : 0;

    // Count new overdue today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newOverdueToday = processedTransactions.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    }).length;

    const stats = {
      totalOverdue,
      totalFineAmount: parseFloat(totalFineAmount.toFixed(2)),
      averageDaysOverdue: parseFloat(averageDaysOverdue.toFixed(1)),
      newOverdueToday
    };

    const pagination = {
      page,
      limit,
      totalCount: filteredTransactions.length,
      totalPages: Math.ceil(filteredTransactions.length / limit),
      hasNext: page * limit < filteredTransactions.length,
      hasPrev: page > 1
    };

    return NextResponse.json({
      success: true,
      overdueTransactions: paginatedTransactions,
      stats,
      pagination
    });

  } catch (error: any) {
    console.error('Error fetching overdue transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch overdue transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Process return or send reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, transactionId, fineAmount, reminderMessage } = body;

    if (!action || !transactionId) {
      return NextResponse.json(
        { success: false, error: 'Action and transaction ID are required' },
        { status: 400 }
      );
    }

    if (action === 'return') {
      // Mark book as returned
      const updatedTransaction = await prisma.transaction.update({
        where: { transactionId: parseInt(transactionId) },
        data: {
          isReturned: true,
          returnedAt: new Date(),
          finePaid: fineAmount || 0
        },
        include: {
          item: {
            select: {
              itemId: true,
              title: true,
              availableCopies: true,
              totalCopies: true
            }
          }
        }
      });

      // Update available copies
      await prisma.item.update({
        where: { itemId: updatedTransaction.item.itemId },
        data: {
          availableCopies: {
            increment: 1
          }
        }
      });

      // Create notification for patron
      await prisma.notification.create({
        data: {
          recipientId: updatedTransaction.patronId,
          recipientType: 'PATRON',
          type: 'GENERAL',
          title: 'Book Returned',
          message: `Your book "${updatedTransaction.item.title}" has been marked as returned.${fineAmount ? ` Fine paid: $${fineAmount.toFixed(2)}` : ''}`,
          relatedId: updatedTransaction.transactionId,
          relatedType: 'TRANSACTION'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Book marked as returned successfully',
        transaction: updatedTransaction
      });

    } else if (action === 'reminder') {
      // Send reminder (create notification)
      const transaction = await prisma.transaction.findUnique({
        where: { transactionId: parseInt(transactionId) },
        include: {
          patron: {
            select: {
              patronId: true,
              patronFirstName: true,
              patronLastName: true,
              patronEmail: true
            }
          },
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
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }

      // Create reminder notification
      await prisma.notification.create({
        data: {
          recipientId: transaction.patronId,
          recipientType: 'PATRON',
          type: 'BOOK_OVERDUE',
          title: 'Overdue Book Reminder',
          message: reminderMessage || `Reminder: Your book "${transaction.item.title}" by ${transaction.item.author} is overdue. Please return it as soon as possible.`,
          relatedId: transaction.transactionId,
          relatedType: 'TRANSACTION'
        }
      });

      return NextResponse.json({
        success: true,
        message: `Reminder sent to ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error processing overdue action:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
