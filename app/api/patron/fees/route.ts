import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Calculate dynamic fees for a patron
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patronId = searchParams.get('patronId');

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

    // Get patron details with transactions
    const patron = await prisma.patron.findUnique({
      where: { patronId: parsedPatronId },
      include: {
        transaction: {
          where: { isReturned: false },
          include: {
            item: {
              select: {
                title: true,
                author: true,
                price: true
              }
            }
          }
        },
        student: true,
        faculty: true
      }
    });

    if (!patron) {
      return NextResponse.json(
        { error: 'Patron not found' },
        { status: 404 }
      );
    }

    // Get library settings
    const settings = await prisma.librarysettings.findFirst();
    const finePerDay = settings?.finePerDay || 1.0;

    const today = new Date();
    const fees: Array<{
      type: string;
      description: string;
      amount: number;
      dueDate?: string;
      relatedTransactionId?: number;
      calculatedFromOverdueBooks?: boolean;
    }> = [];

    // 1. Membership Fee Calculation
    const membershipRenewalDate = new Date(patron.patronCreatedAt);
    membershipRenewalDate.setFullYear(membershipRenewalDate.getFullYear() + 1);
    
    if (membershipRenewalDate <= today) {
      const isStudent = patron.isStudent;
      const membershipAmount = isStudent ? 25.00 : 50.00; // Students get discount
      
      fees.push({
        type: 'MEMBERSHIP_FEE',
        description: `Annual Library Membership Fee (${isStudent ? 'Student' : 'Faculty'})`,
        amount: membershipAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Due in 30 days
      });
    }

    // 2. Late Fees for Overdue Books
    let totalLateFees = 0;
    const overdueTransactions = patron.transaction.filter(transaction => {
      return new Date(transaction.dueDate) < today;
    });

    for (const transaction of overdueTransactions) {
      const dueDate = new Date(transaction.dueDate);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const lateFee = daysOverdue * finePerDay;
      totalLateFees += lateFee;

      fees.push({
        type: 'LATE_FEE',
        description: `Late fee for "${transaction.item.title}" (${daysOverdue} days overdue)`,
        amount: lateFee,
        relatedTransactionId: transaction.transactionId,
        calculatedFromOverdueBooks: true
      });
    }

    // 3. Processing Fee (for any new transactions)
    if (patron.transaction.length > 0) {
      const hasRecentTransactions = patron.transaction.some(t => {
        const borrowDate = new Date(t.borrowedAt);
        const daysSinceBorrow = Math.ceil((today.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceBorrow <= 30; // Recent if within last 30 days
      });

      if (hasRecentTransactions) {
        fees.push({
          type: 'PROCESSING_FEE',
          description: 'Book Processing Fee',
          amount: 5.00
        });
      }
    }

    // 4. Check for existing unpaid fees to avoid duplicates
    const existingPayments = await prisma.payment.findMany({
      where: {
        patronId: parsedPatronId,
        paymentStatus: 'PENDING'
      }
    });

    // Filter out fees that already have pending payments
    const filteredFees = fees.filter(fee => {
      return !existingPayments.some(payment => 
        payment.paymentType === fee.type &&
        payment.description === fee.description
      );
    });

    // 5. Generate suggested amounts for different fee types
    const suggestedFees = {
      MEMBERSHIP_FEE: {
        student: 25.00,
        faculty: 50.00,
        description: 'Annual library membership'
      },
      PROCESSING_FEE: {
        standard: 5.00,
        description: 'Book processing and handling fee'
      },
      LATE_FEE: {
        perDay: finePerDay,
        description: 'Late return penalty per day'
      },
      DAMAGE_FEE: {
        minor: 10.00,
        moderate: 25.00,
        major: 50.00,
        replacement: 100.00,
        description: 'Book damage assessment fee'
      },
      LOST_BOOK_FEE: {
        standard: 75.00,
        rare: 150.00,
        description: 'Lost book replacement fee'
      },
      FINE: {
        minor: 5.00,
        standard: 15.00,
        major: 30.00,
        description: 'Library policy violation fine'
      }
    };

    // Calculate totals
    const totalAmount = filteredFees.reduce((sum, fee) => sum + fee.amount, 0);
    const overdueCount = overdueTransactions.length;

    return NextResponse.json({
      patron: {
        id: patron.patronId,
        name: `${patron.patronFirstName} ${patron.patronLastName}`,
        email: patron.patronEmail,
        isStudent: patron.isStudent,
        isFaculty: patron.isFaculty,
        memberSince: patron.patronCreatedAt.toISOString()
      },
      calculatedFees: filteredFees,
      suggestedFees,
      summary: {
        totalAmount,
        feeCount: filteredFees.length,
        overdueCount,
        hasMembershipDue: filteredFees.some(f => f.type === 'MEMBERSHIP_FEE'),
        hasOverdueFees: filteredFees.some(f => f.calculatedFromOverdueBooks)
      },
      settings: {
        finePerDay,
        membershipDiscountForStudents: true
      }
    });

  } catch (error) {
    console.error('Error calculating fees:', error);
    return NextResponse.json(
      { error: 'Failed to calculate fees' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
