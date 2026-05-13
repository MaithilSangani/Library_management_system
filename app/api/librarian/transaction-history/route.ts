import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const patronId = searchParams.get('patronId') || '';
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    // Search functionality
    if (search) {
      const searchTerm = search.trim();
      whereClause.OR = [
        {
          patron: {
            OR: [
              { patronFirstName: { contains: searchTerm } },
              { patronLastName: { contains: searchTerm } },
              { patronEmail: { contains: searchTerm } }
            ]
          }
        },
        {
          item: {
            OR: [
              { title: { contains: searchTerm } },
              { author: { contains: searchTerm } },
              { isbn: { contains: searchTerm } }
            ]
          }
        }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause.isReturned = false;
      } else if (status === 'returned') {
        whereClause.isReturned = true;
      } else if (status === 'overdue') {
        whereClause.AND = [
          { isReturned: false },
          { dueDate: { lt: new Date() } }
        ];
      }
    }

    // Date range filter
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      
      whereClause.borrowedAt = {
        gte: fromDate,
        lte: toDate
      };
    }

    // Patron filter
    if (patronId) {
      whereClause.patronId = parseInt(patronId);
    }

    // Get both transactions and general payments
    const [transactions, generalPayments, totalTransactions, totalPayments] = await Promise.all([
      // Book transactions
      prisma.transaction.findMany({
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
          },
          payment: {
            select: {
              paymentId: true,
              amount: true,
              paymentType: true,
              paymentStatus: true,
              description: true,
              paymentMethod: true,
              referenceNumber: true,
              createdAt: true,
              paidDate: true
            }
          }
        },
        orderBy: {
          borrowedAt: 'desc'
        },
        take: limit
      }),
      // General payments from patron panel
      prisma.payment.findMany({
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
          transaction: {
            select: {
              transactionId: true,
              item: {
                select: {
                  title: true,
                  author: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      }),
      prisma.transaction.count({ where: whereClause }),
      prisma.payment.count()
    ]);

    // Calculate additional info for each transaction
    const enhancedTransactions = transactions.map(transaction => {
      const now = new Date();
      const isOverdue = !transaction.isReturned && transaction.dueDate < now;
      const daysOverdue = isOverdue 
        ? Math.floor((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Calculate fine amount
      const finePerDay = 1.0; // Default fine rate, could be fetched from library settings
      const calculatedFine = isOverdue ? daysOverdue * finePerDay : 0;

      // Check if fine is paid (from fine/late fee payments linked to this transaction)
      const totalFinePaid = transaction.payment.filter(payment => 
        payment.paymentType === 'FINE' || payment.paymentType === 'LATE_FEE'
      ).reduce((sum, payment) => sum + payment.amount, 0);
      const outstandingFine = Math.max(0, calculatedFine - totalFinePaid);

      return {
        ...transaction,
        recordType: 'transaction', // Indicate this is a transaction record
        isOverdue,
        daysOverdue,
        calculatedFine,
        totalFinePaid,
        outstandingFine,
        status: transaction.isReturned ? 'returned' : (isOverdue ? 'overdue' : 'active'),
        patronName: `${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`,
        patronType: transaction.patron.isStudent ? 'Student' : (transaction.patron.isFaculty ? 'Faculty' : 'General'),
        patronDetails: transaction.patron.isStudent 
          ? `${transaction.patron.student?.studentDepartment || 'N/A'} - Sem ${transaction.patron.student?.studentSemester || 'N/A'}`
          : transaction.patron.isFaculty
            ? transaction.patron.faculty?.facultyDepartment || 'N/A'
            : 'General Member',
        date: transaction.borrowedAt // Primary date for sorting
      };
    });

    // Transform general payments to match the structure
    const enhancedPayments = generalPayments.map(payment => {
      return {
        paymentId: payment.paymentId,
        recordType: 'payment', // Indicate this is a payment record
        patron: payment.patron,
        patronName: `${payment.patron.patronFirstName} ${payment.patron.patronLastName}`,
        patronType: payment.patron.isStudent ? 'Student' : (payment.patron.isFaculty ? 'Faculty' : 'General'),
        patronDetails: payment.patron.isStudent 
          ? `${payment.patron.student?.studentDepartment || 'N/A'} - Sem ${payment.patron.student?.studentSemester || 'N/A'}`
          : payment.patron.isFaculty
            ? payment.patron.faculty?.facultyDepartment || 'N/A'
            : 'General Member',
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentStatus: payment.paymentStatus,
        description: payment.description,
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.referenceNumber,
        date: payment.paidDate || payment.createdAt, // Primary date for sorting
        createdAt: payment.createdAt,
        paidDate: payment.paidDate,
        // Include related transaction info if exists
        relatedTransaction: payment.transaction ? {
          transactionId: payment.transaction.transactionId,
          itemTitle: payment.transaction.item?.title,
          itemAuthor: payment.transaction.item?.author
        } : null
      };
    });

    // Combine both datasets
    const combinedRecords = [...enhancedTransactions, ...enhancedPayments];
    
    // Sort combined records by date (most recent first)
    combinedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply pagination to combined results
    const paginatedRecords = combinedRecords.slice(offset, offset + limit);
    const totalRecords = totalTransactions + totalPayments;

    // Calculate summary statistics
    const summary = {
      totalTransactions: totalTransactions,
      totalPayments: totalPayments,
      totalRecords: totalRecords,
      activeLoans: enhancedTransactions.filter(t => t.status === 'active').length,
      overdueItems: enhancedTransactions.filter(t => t.status === 'overdue').length,
      returnedBooks: enhancedTransactions.filter(t => t.status === 'returned').length,
      totalFinesCollected: enhancedTransactions.reduce((sum, t) => sum + t.totalFinePaid, 0),
      outstandingFines: enhancedTransactions.reduce((sum, t) => sum + t.outstandingFine, 0),
      totalGeneralPayments: enhancedPayments.reduce((sum, p) => sum + p.amount, 0),
      paidPayments: enhancedPayments.filter(p => p.paymentStatus === 'PAID').length,
      pendingPayments: enhancedPayments.filter(p => p.paymentStatus === 'PENDING').length
    };

    return NextResponse.json({
      success: true,
      data: {
        records: paginatedRecords, // Combined transactions and payments
        transactions: enhancedTransactions, // Separate transaction data if needed
        payments: enhancedPayments, // Separate payment data if needed
        summary,
        pagination: {
          page,
          limit,
          total: totalRecords,
          pages: Math.ceil(totalRecords / limit),
          hasNext: page * limit < totalRecords,
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transaction history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET single transaction details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { transactionId: parseInt(transactionId) },
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
            condition: true,
            price: true
          }
        },
        payment: {
          select: {
            paymentId: true,
            amount: true,
            paymentType: true,
            paymentStatus: true,
            paidDate: true,
            paymentMethod: true,
            referenceNumber: true,
            description: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
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

    // Calculate additional details
    const now = new Date();
    const isOverdue = !transaction.isReturned && transaction.dueDate < now;
    const daysOverdue = isOverdue 
      ? Math.floor((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const finePerDay = 1.0;
    const calculatedFine = isOverdue ? daysOverdue * finePerDay : 0;
    const totalFinePaid = transaction.payment.filter(payment => 
      payment.paymentType === 'FINE' || payment.paymentType === 'LATE_FEE'
    ).reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingFine = Math.max(0, calculatedFine - totalFinePaid);

    const enhancedTransaction = {
      ...transaction,
      isOverdue,
      daysOverdue,
      calculatedFine,
      totalFinePaid,
      outstandingFine,
      status: transaction.isReturned ? 'returned' : (isOverdue ? 'overdue' : 'active'),
      patronName: `${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`,
      patronType: transaction.patron.isStudent ? 'Student' : (transaction.patron.isFaculty ? 'Faculty' : 'General'),
      patronDetails: transaction.patron.isStudent 
        ? `${transaction.patron.student?.studentDepartment || 'N/A'} - Sem ${transaction.patron.student?.studentSemester || 'N/A'}`
        : transaction.patron.isFaculty
          ? transaction.patron.faculty?.facultyDepartment || 'N/A'
          : 'General Member',
      loanDuration: Math.floor((new Date().getTime() - transaction.borrowedAt.getTime()) / (1000 * 60 * 60 * 24)),
      renewalsUsed: transaction.renewalCount || 0,
      maxRenewals: 2, // Could be fetched from library settings
      finepayment: transaction.payment.map(payment => ({
        paymentId: payment.paymentId,
        amount: payment.amount,
        paidAt: payment.paidDate,
        paymentMethod: payment.paymentMethod || 'N/A'
      }))
    };

    return NextResponse.json({
      success: true,
      data: enhancedTransaction
    });

  } catch (error: any) {
    console.error('Error fetching transaction details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transaction details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
