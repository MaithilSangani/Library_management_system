import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'paidAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    let whereClause: any = {};

    // Search in patron name, email, or book title
    if (search) {
      whereClause.OR = [
        {
          patron: {
            OR: [
              { patronFirstName: { contains: search, mode: 'insensitive' } },
              { patronLastName: { contains: search, mode: 'insensitive' } },
              { patronEmail: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          transaction: {
            item: {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.paidAt = {};
      if (dateFrom) {
        whereClause.paidAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 23:59:59 to include the entire day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.paidAt.lte = endDate;
      }
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === 'paidAt' || sortBy === 'amount') {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'patronName') {
      orderBy.patron = { patronFirstName: sortOrder };
    } else if (sortBy === 'bookTitle') {
      orderBy.transaction = { item: { title: sortOrder } };
    }

    // Get total count for pagination
    const totalCount = await prisma.finepayment.count({
      where: whereClause
    });

    // Fetch fine payments with related data
    const finePayments = await prisma.finepayment.findMany({
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
        transaction: {
          select: {
            transactionId: true,
            borrowedAt: true,
            dueDate: true,
            returnedAt: true,
            isReturned: true,
            renewalCount: true,
            item: {
              select: {
                itemId: true,
                title: true,
                author: true,
                isbn: true,
                itemType: true,
                subject: true
              }
            }
          }
        }
      },
      orderBy: orderBy,
      skip: offset,
      take: limit
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Calculate summary stats
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalPayments: totalCount,
      totalAmountCollected: await prisma.finepayment.aggregate({
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0),
      paymentsThisMonth: await prisma.finepayment.count({
        where: {
          paidAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
        }
      }),
      amountThisMonth: await prisma.finepayment.aggregate({
        where: {
          paidAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
        },
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0),
      uniquePatrons: await prisma.finepayment.groupBy({
        by: ['patronId']
      }).then(result => result.length),
      averagePayment: await prisma.finepayment.aggregate({
        _avg: { amount: true }
      }).then(result => result._avg.amount || 0)
    };

    // Transform data for response
    const paymentsWithDetails = finePayments.map(payment => {
      const patron = payment.patron;
      const transaction = payment.transaction;
      
      // Calculate transaction details
      const today = new Date();
      const dueDate = new Date(transaction.dueDate);
      const borrowedDate = new Date(transaction.borrowedAt);
      
      let daysOverdue = 0;
      if (!transaction.isReturned && dueDate < today) {
        daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        paymentId: payment.paymentId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        paidAt: payment.paidAt.toISOString(),
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.paymentReference,
        notes: payment.notes,
        processedBy: payment.processedBy,
        patron: {
          patronId: patron.patronId,
          name: `${patron.patronFirstName} ${patron.patronLastName}`,
          email: patron.patronEmail,
          type: patron.isStudent ? 'Student' : patron.isFaculty ? 'Faculty' : 'Patron',
          student: patron.student ? {
            department: patron.student.studentDepartment,
            semester: patron.student.studentSemester,
            rollNo: patron.student.studentRollNo,
            enrollmentNumber: patron.student.studentEnrollmentNumber
          } : null,
          faculty: patron.faculty ? {
            department: patron.faculty.facultyDepartment
          } : null
        },
        book: {
          itemId: transaction.item.itemId,
          title: transaction.item.title,
          author: transaction.item.author,
          isbn: transaction.item.isbn,
          itemType: transaction.item.itemType,
          subject: transaction.item.subject
        },
        transactionDetails: {
          borrowedAt: transaction.borrowedAt.toISOString(),
          dueDate: transaction.dueDate.toISOString(),
          returnedAt: transaction.returnedAt?.toISOString() || null,
          isReturned: transaction.isReturned,
          renewalCount: transaction.renewalCount,
          daysOverdue: daysOverdue
        }
      };
    });

    return NextResponse.json({
      payments: paymentsWithDetails,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      },
      stats,
      filters: {
        search: search || '',
        sortBy,
        sortOrder,
        dateFrom: dateFrom || '',
        dateTo: dateTo || ''
      },
      success: true
    });

  } catch (error) {
    console.error('Error fetching fine payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fine payments' },
      { status: 500 }
    );
  }
}
