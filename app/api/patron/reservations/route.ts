import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/patron/reservations - Get patron's reservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patronId = searchParams.get('patronId');

    if (!patronId || isNaN(parseInt(patronId))) {
      return NextResponse.json(
        { error: 'Valid Patron ID is required' },
        { status: 400 }
      );
    }

    // Fetch borrow requests which act as reservations in this system
    const borrowRequests = await prisma.borrowrequest.findMany({
      where: {
        patronId: parseInt(patronId)
      },
      include: {
        item: {
          select: {
            itemId: true,
            title: true,
            author: true,
            isbn: true,
            itemType: true,
            availableCopies: true,
            totalCopies: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Transform borrow requests to match the reservation interface expected by the frontend
    const reservations = borrowRequests.map(request => {
      const now = new Date();
      const requestedAt = new Date(request.requestedAt);
      const daysAgo = Math.floor((now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine status based on borrow request status
      let status: 'ready' | 'pending' | 'waiting';
      switch (request.status) {
        case 'APPROVED':
          status = 'ready';
          break;
        case 'PENDING':
          status = request.item.availableCopies > 0 ? 'pending' : 'waiting';
          break;
        case 'REJECTED':
        case 'EXPIRED':
        default:
          status = 'waiting';
          break;
      }

      return {
        reservationId: request.requestId,
        reservedAt: request.requestedAt.toISOString(),
        daysAgo,
        status,
        expiresAt: request.expiresAt?.toISOString(),
        queuePosition: status === 'waiting' ? Math.floor(Math.random() * 5) + 1 : undefined, // Mock queue position for now
        item: request.item
      };
    });

    return NextResponse.json(reservations, { status: 200 });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/patron/reservations - Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Mock response - you'll need to replace this with actual database operations
    const mockReservation = {
      reservationId: Math.floor(Math.random() * 1000),
      itemId,
      reservedAt: new Date().toISOString(),
      status: 'pending'
    };

    return NextResponse.json(mockReservation, { status: 201 });
    
    // TODO: Implement actual database operation like this:
    /*
    // First check if patron already has a reservation for this item
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        patronId: patronId, // Get from authenticated session
        itemId: parseInt(itemId),
        status: { in: ['pending', 'ready'] }
      }
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: 'You already have a reservation for this item' },
        { status: 409 }
      );
    }

    // Check if patron already has the item borrowed
    const existingLoan = await prisma.borrowing.findFirst({
      where: {
        patronId: patronId,
        itemId: parseInt(itemId),
        returnedAt: null
      }
    });

    if (existingLoan) {
      return NextResponse.json(
        { error: 'You already have this item borrowed' },
        { status: 409 }
      );
    }

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: {
        patronId: patronId,
        itemId: parseInt(itemId),
        status: 'pending'
      },
      include: {
        item: true
      }
    });

    return NextResponse.json(reservation, { status: 201 });
    */
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}
