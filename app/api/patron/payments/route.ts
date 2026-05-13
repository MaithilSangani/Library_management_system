import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch patron's payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patronId = searchParams.get('patronId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!patronId) {
      return NextResponse.json(
        { error: 'Patron ID is required' },
        { status: 400 }
      );
    }

    const parsedPatronId = parseInt(patronId);
    if (isNaN(parsedPatronId)) {
      return NextResponse.json(
        { error: 'Patron ID must be a valid number' },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {
      patronId: parsedPatronId
    };

    if (status && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
      whereClause.paymentStatus = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          transaction: {
            include: {
              item: {
                select: {
                  title: true,
                  author: true,
                  itemType: true
                }
              }
            }
          }
        },
        orderBy: [
          { paymentStatus: 'asc' }, // Pending first
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.payment.count({
        where: whereClause
      })
    ]);

    // Calculate payment statistics
    const stats = await prisma.payment.aggregate({
      where: { patronId: parsedPatronId },
      _sum: {
        amount: true
      }
    });

    const statusCounts = await prisma.payment.groupBy({
      by: ['paymentStatus'],
      where: { patronId: parsedPatronId },
      _count: {
        paymentId: true
      },
      _sum: {
        amount: true
      }
    });

    // Process payments with calculated fields
    const paymentsWithDetails = payments.map(payment => {
      const today = new Date();
      let isOverdue = false;
      let daysOverdue = 0;

      if (payment.dueDate && payment.paymentStatus === 'PENDING') {
        const dueDate = new Date(payment.dueDate);
        if (dueDate < today) {
          isOverdue = true;
          daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        ...payment,
        isOverdue,
        daysOverdue,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        dueDate: payment.dueDate?.toISOString() || null,
        paidDate: payment.paidDate?.toISOString() || null
      };
    });

    // Separate current and historical payments
    const pendingPayments = paymentsWithDetails.filter(p => p.paymentStatus === 'PENDING');
    const overduePayments = paymentsWithDetails.filter(p => p.paymentStatus === 'PENDING' && p.isOverdue);
    const paidPayments = paymentsWithDetails.filter(p => p.paymentStatus === 'PAID');

    return NextResponse.json({
      payments: paymentsWithDetails,
      pendingPayments,
      overduePayments,
      paidPayments,
      stats: {
        totalAmount: stats._sum.amount || 0,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.paymentStatus] = {
            count: item._count.paymentId,
            amount: item._sum.amount || 0
          };
          return acc;
        }, {} as any)
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create a new payment (typically used by system, not patron directly)
export async function POST(request: NextRequest) {
  try {
    const { 
      patronId, 
      transactionId, 
      amount, 
      paymentType, 
      description, 
      dueDate 
    } = await request.json();

    // Validate required fields
    if (!patronId || !amount || !paymentType) {
      return NextResponse.json(
        { error: 'Patron ID, amount, and payment type are required' },
        { status: 400 }
      );
    }

    const parsedPatronId = parseInt(patronId);
    if (isNaN(parsedPatronId)) {
      return NextResponse.json(
        { error: 'Patron ID must be a valid number' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify patron exists
    const patron = await prisma.patron.findUnique({
      where: { patronId: parsedPatronId }
    });

    if (!patron) {
      return NextResponse.json(
        { error: 'Patron not found' },
        { status: 404 }
      );
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        patronId: parsedPatronId,
        transactionId: transactionId ? parseInt(transactionId) : null,
        amount: parseFloat(amount),
        paymentType,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        transaction: {
          include: {
            item: {
              select: {
                title: true,
                author: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Payment created successfully',
      payment: {
        ...payment,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        dueDate: payment.dueDate?.toISOString() || null,
        paidDate: payment.paidDate?.toISOString() || null
      }
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Update payment (typically to mark as paid)
export async function PUT(request: NextRequest) {
  try {
    const { 
      paymentId, 
      paymentStatus, 
      paymentMethod, 
      referenceNumber 
    } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const parsedPaymentId = parseInt(paymentId);
    if (isNaN(parsedPaymentId)) {
      return NextResponse.json(
        { error: 'Payment ID must be a valid number' },
        { status: 400 }
      );
    }

    // Find the payment
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentId: parsedPaymentId }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'PAID') {
        updateData.paidDate = new Date();
      }
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (referenceNumber) {
      updateData.referenceNumber = referenceNumber;
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { paymentId: parsedPaymentId },
      data: updateData,
      include: {
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true
          }
        },
        transaction: {
          include: {
            item: {
              select: {
                title: true,
                author: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Payment updated successfully',
      payment: {
        ...updatedPayment,
        createdAt: updatedPayment.createdAt.toISOString(),
        updatedAt: updatedPayment.updatedAt.toISOString(),
        dueDate: updatedPayment.dueDate?.toISOString() || null,
        paidDate: updatedPayment.paidDate?.toISOString() || null
      }
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
