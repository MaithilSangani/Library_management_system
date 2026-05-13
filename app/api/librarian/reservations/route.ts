import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all reservations for librarian management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereClause: any = {};

    // Filter by status if provided
    if (status && status !== 'all') {
      // We can add custom status logic here based on reservation dates, etc.
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        {
          item: {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          item: {
            isbn: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          patron: {
            patronFirstName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          patron: {
            patronLastName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
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
        },
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
        }
      },
      orderBy: {
        reservedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Calculate additional information for each reservation
    const reservationsWithDetails = reservations.map(reservation => {
      const today = new Date();
      const reservedDate = new Date(reservation.reservedAt);
      const daysAgo = Math.floor((today.getTime() - reservedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Define reservation status based on business logic
      let reservationStatus = 'pending';
      if (reservation.item.availableCopies > 0) {
        reservationStatus = 'ready';
      } else if (daysAgo > 7) {
        reservationStatus = 'waiting';
      }

      return {
        ...reservation,
        reservedAt: reservation.reservedAt.toISOString(),
        daysAgo,
        status: reservationStatus,
        canFulfill: reservation.item.availableCopies > 0
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.reservation.count({ where: whereClause });

    // Get statistics
    const stats = {
      totalReservations: totalCount,
      readyReservations: reservationsWithDetails.filter(r => r.status === 'ready').length,
      pendingReservations: reservationsWithDetails.filter(r => r.status === 'pending').length,
      waitingReservations: reservationsWithDetails.filter(r => r.status === 'waiting').length,
    };

    return NextResponse.json({
      reservations: reservationsWithDetails,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
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

// POST: Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const { patronId, itemId } = await request.json();

    // Validate required fields
    if (!patronId || !itemId) {
      return NextResponse.json(
        { error: 'Patron ID and Item ID are required' },
        { status: 400 }
      );
    }

    // Check if patron exists
    const patron = await prisma.patron.findUnique({
      where: { patronId: parseInt(patronId) }
    });

    if (!patron) {
      return NextResponse.json(
        { error: 'Patron not found' },
        { status: 404 }
      );
    }

    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { itemId: parseInt(itemId) }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if patron already has this item reserved
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        patronId: parseInt(patronId),
        itemId: parseInt(itemId)
      }
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Patron already has this item reserved' },
        { status: 400 }
      );
    }

    // Check if patron already has this item borrowed
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        patronId: parseInt(patronId),
        itemId: parseInt(itemId),
        isReturned: false
      }
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Patron already has this item borrowed' },
        { status: 400 }
      );
    }

    // Create the reservation
    const newReservation = await prisma.reservation.create({
      data: {
        patronId: parseInt(patronId),
        itemId: parseInt(itemId)
      },
      include: {
        item: {
          select: {
            title: true,
            author: true,
            isbn: true
          }
        },
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Reservation created successfully',
      reservation: newReservation
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
