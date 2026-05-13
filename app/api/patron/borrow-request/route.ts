import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Create a new borrow request
export async function POST(request: NextRequest) {
  try {
    const { itemId, patronId, notes } = await request.json();

    // Validate required fields
    if (!itemId || !patronId) {
      return NextResponse.json(
        { error: 'Item ID and Patron ID are required' },
        { status: 400 }
      );
    }

    const parsedItemId = parseInt(itemId);
    const parsedPatronId = parseInt(patronId);
    
    if (isNaN(parsedItemId) || isNaN(parsedPatronId)) {
      return NextResponse.json(
        { error: 'Item ID and Patron ID must be valid numbers' },
        { status: 400 }
      );
    }

    // Check if patron exists
    const patron = await prisma.patron.findUnique({
      where: { patronId: parsedPatronId },
      include: {
        transaction: {
          where: { isReturned: false }
        },
        borrowrequest: {
          where: { 
            status: 'PENDING',
            expiresAt: { gt: new Date() }
          }
        }
      }
    });

    if (!patron) {
      return NextResponse.json(
        { error: 'Patron not found' },
        { status: 404 }
      );
    }

    // Get library settings
    const librarySettings = await prisma.librarysettings.findFirst();
    const borrowingLimit = librarySettings?.borrowingLimit || 5;

    // Check if patron has reached borrowing limit (active transactions + pending requests)
    const totalActiveItems = patron.transaction.length + patron.borrowrequest.length;
    if (totalActiveItems >= borrowingLimit) {
      return NextResponse.json(
        { error: `You have reached your borrowing limit of ${borrowingLimit} books (including pending requests)` },
        { status: 400 }
      );
    }

    // Check if item exists and is available
    const item = await prisma.item.findUnique({
      where: { 
        itemId: parsedItemId,
        isVisible: true
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found or unavailable' },
        { status: 404 }
      );
    }

    if (item.availableCopies <= 0) {
      return NextResponse.json(
        { error: 'This book is currently unavailable' },
        { status: 400 }
      );
    }

    // Check if patron already has this book borrowed
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        patronId: parsedPatronId,
        itemId: parsedItemId,
        isReturned: false
      }
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'You have already borrowed this book' },
        { status: 400 }
      );
    }

    // Check if patron already has a pending request for this book
    const existingRequest = await prisma.borrowrequest.findFirst({
      where: {
        patronId: parsedPatronId,
        itemId: parsedItemId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this book' },
        { status: 400 }
      );
    }

    // Create expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the borrow request and notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the borrow request
      const borrowRequest = await tx.borrowrequest.create({
        data: {
          patronId: parsedPatronId,
          itemId: parsedItemId,
          notes: notes || null,
          expiresAt: expiresAt,
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

      // Create notification for patron (confirmation)
      // Note: Due to schema constraints, all notifications must reference patronId
      await tx.notification.create({
        data: {
          recipientId: parsedPatronId,
          recipientType: 'PATRON',
          type: 'BORROW_REQUEST',
          title: 'Borrow Request Submitted',
          message: `Your request to borrow "${item.title}" has been submitted and is pending librarian approval.`,
          relatedId: borrowRequest.requestId,
          relatedType: 'BORROW_REQUEST'
        }
      });

      // TODO: Fix schema to properly support librarian notifications
      // For now, we skip librarian notifications due to foreign key constraints
      // The notification schema needs to be updated to support librarian recipients
      console.log('📝 Borrow request created - librarian notifications skipped due to schema constraints');

      return borrowRequest;
    });

    return NextResponse.json({
      message: 'Borrow request submitted successfully!',
      requestId: result.requestId,
      status: 'PENDING',
      expiresAt: expiresAt.toISOString(),
      note: 'Your request will be reviewed by a librarian. You will receive a notification once it is processed.'
    });

  } catch (error) {
    console.error('Error creating borrow request:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You already have a pending request for this book' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit borrow request. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET: Get patron's borrow requests
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

    const borrowRequests = await prisma.borrowrequest.findMany({
      where: {
        patronId: parseInt(patronId)
      },
      include: {
        item: {
          select: {
            title: true,
            author: true,
            isbn: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    return NextResponse.json(borrowRequests);

  } catch (error) {
    console.error('Error fetching borrow requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrow requests' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
