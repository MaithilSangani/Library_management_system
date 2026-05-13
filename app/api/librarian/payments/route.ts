import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Get all payments for librarian review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const patronSearch = searchParams.get('search');
    const paymentType = searchParams.get('paymentType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (status && status !== 'ALL') {
      whereClause.paymentStatus = status;
    }

    if (paymentType && paymentType !== 'ALL') {
      whereClause.paymentType = paymentType;
    }

    // For patron search, we'll filter after the query
    let payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patron: {
          select: {
            patronId: true,
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true,
            isStudent: true,
            isFaculty: true
          }
        },
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
        { createdAt: 'desc' }
      ]
    });

    // Apply patron search filter if provided
    if (patronSearch) {
      const searchTerm = patronSearch.toLowerCase();
      payments = payments.filter(payment => 
        payment.patron.patronFirstName.toLowerCase().includes(searchTerm) ||
        payment.patron.patronLastName.toLowerCase().includes(searchTerm) ||
        payment.patron.patronEmail.toLowerCase().includes(searchTerm)
      );
    }

    const total = payments.length;
    const paginatedPayments = payments.slice(offset, offset + limit);

    // Calculate statistics
    const stats = {
      totalPayments: payments.length,
      pendingCount: payments.filter(p => p.paymentStatus === 'PENDING').length,
      pendingAmount: payments
        .filter(p => p.paymentStatus === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments
        .filter(p => p.paymentStatus === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0),
      overdueCount: payments.filter(p => {
        if (p.paymentStatus !== 'PENDING' || !p.dueDate) return false;
        return new Date(p.dueDate) < new Date();
      }).length
    };

    // Get payment type breakdown
    const paymentTypeStats = payments.reduce((acc, payment) => {
      const type = payment.paymentType;
      if (!acc[type]) {
        acc[type] = { count: 0, amount: 0 };
      }
      acc[type].count++;
      acc[type].amount += payment.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return NextResponse.json({
      payments: paginatedPayments.map(payment => ({
        ...payment,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        dueDate: payment.dueDate?.toISOString() || null,
        paidDate: payment.paidDate?.toISOString() || null,
        isOverdue: payment.dueDate && payment.paymentStatus === 'PENDING' 
          ? new Date(payment.dueDate) < new Date()
          : false
      })),
      stats,
      paymentTypeStats,
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

// PUT: Update payment status (for librarian actions)
export async function PUT(request: NextRequest) {
  try {
    const { 
      paymentId, 
      paymentStatus, 
      notes,
      librarianEmail 
    } = await request.json();

    if (!paymentId || !paymentStatus || !librarianEmail) {
      return NextResponse.json(
        { error: 'Payment ID, status, and librarian email are required' },
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
    const payment = await prisma.payment.findUnique({
      where: { paymentId: parsedPaymentId },
      include: {
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update the payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { paymentId: parsedPaymentId },
        data: {
          paymentStatus,
          ...(paymentStatus === 'PAID' && { paidDate: new Date() }),
          ...(notes && { description: `${payment.description} - Librarian Note: ${notes}` })
        }
      });

      // Create notification for patron
      const notificationTitle = paymentStatus === 'PAID' 
        ? 'Payment Confirmed'
        : paymentStatus === 'CANCELLED'
        ? 'Payment Cancelled'
        : 'Payment Status Updated';

      const notificationMessage = paymentStatus === 'PAID'
        ? `Your payment of $${payment.amount} for ${payment.description || payment.paymentType} has been confirmed by the library staff.`
        : paymentStatus === 'CANCELLED'
        ? `Your payment of $${payment.amount} for ${payment.description || payment.paymentType} has been cancelled. ${notes || ''}`
        : `Your payment status has been updated to ${paymentStatus}. ${notes || ''}`;

      await tx.notification.create({
        data: {
          recipientId: payment.patronId,
          recipientType: 'PATRON',
          type: 'GENERAL',
          title: notificationTitle,
          message: notificationMessage,
          relatedId: parsedPaymentId,
          relatedType: 'PAYMENT'
        }
      });

      return updatedPayment;
    });

    return NextResponse.json({
      message: 'Payment updated successfully',
      payment: {
        ...result,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        dueDate: result.dueDate?.toISOString() || null,
        paidDate: result.paidDate?.toISOString() || null
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
