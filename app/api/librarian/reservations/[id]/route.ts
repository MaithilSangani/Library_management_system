import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// PUT: Fulfill or update a reservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);
    const { action, dueDate } = await request.json();

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    // Find the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { reservationId },
      include: {
        item: true,
        patron: {
          include: {
            transaction: {
              where: { isReturned: false }
            }
          }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (action === 'fulfill') {
      // Check if item is available
      if (reservation.item.availableCopies <= 0) {
        return NextResponse.json(
          { error: 'No copies available for this item' },
          { status: 400 }
        );
      }

      // Get library settings for borrowing limit and loan period
      const librarySettings = await prisma.librarysettings.findFirst();
      const borrowingLimit = librarySettings?.borrowingLimit || 5;
      const loanPeriodDays = librarySettings?.loanPeriodDays || 14;

      // Check borrowing limit
      if (reservation.patron.transaction.length >= borrowingLimit) {
        return NextResponse.json(
          { error: `Patron has reached borrowing limit of ${borrowingLimit} books` },
          { status: 400 }
        );
      }

      // Calculate due date
      let calculatedDueDate;
      if (dueDate) {
        calculatedDueDate = new Date(dueDate);
      } else {
        calculatedDueDate = new Date();
        calculatedDueDate.setDate(calculatedDueDate.getDate() + loanPeriodDays);
      }

      // Start transaction to fulfill reservation
      const result = await prisma.$transaction(async (tx) => {
        // Create transaction record
        const newTransaction = await tx.transaction.create({
          data: {
            patronId: reservation.patronId,
            itemId: reservation.itemId,
            dueDate: calculatedDueDate,
            isReturned: false
          }
        });

        // Update item availability
        await tx.item.update({
          where: { itemId: reservation.itemId },
          data: { availableCopies: { decrement: 1 } }
        });

        // Create status history entry
        await tx.itemStatusHistory.create({
          data: {
            itemId: reservation.itemId,
            status: 'BORROWED',
            previousStatus: 'RESERVED',
            reason: 'Reservation fulfilled',
            changedBy: 'librarian',
            notes: `Reservation fulfilled for ${reservation.patron.patronFirstName} ${reservation.patron.patronLastName}`
          }
        });

        // Delete the reservation
        await tx.reservation.delete({
          where: { reservationId }
        });

        return newTransaction;
      });

      return NextResponse.json({
        message: 'Reservation fulfilled successfully',
        transaction: result
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error processing reservation:', error);
    return NextResponse.json(
      { error: 'Failed to process reservation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Cancel a reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    // Check if reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { reservationId },
      include: {
        item: {
          select: {
            title: true,
            author: true
          }
        },
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true
          }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Delete the reservation
    await prisma.reservation.delete({
      where: { reservationId }
    });

    return NextResponse.json({
      message: 'Reservation cancelled successfully',
      reservation: {
        reservationId,
        item: reservation.item,
        patron: reservation.patron
      }
    });

  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
