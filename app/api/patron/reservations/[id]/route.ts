import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/patron/reservations/[id] - Cancel a reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const reservationId = resolvedParams.id;

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const requestId = parseInt(reservationId);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    // Find the borrow request (which acts as a reservation)
    const borrowRequest = await prisma.borrowrequest.findUnique({
      where: {
        requestId: requestId
      },
      include: {
        item: {
          select: {
            title: true
          }
        }
      }
    });

    if (!borrowRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if the request can be cancelled (only PENDING requests can be cancelled)
    if (borrowRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel a ${borrowRequest.status.toLowerCase()} request` },
        { status: 400 }
      );
    }

    // Delete the borrow request
    await prisma.borrowrequest.delete({
      where: {
        requestId: requestId
      }
    });

    return NextResponse.json(
      { 
        message: `Request for "${borrowRequest.item.title}" cancelled successfully`,
        success: true
      },
      { status: 200 }
    );
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
