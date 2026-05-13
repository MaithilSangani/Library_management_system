import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Get all borrow requests for librarian review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    
    if (status !== 'ALL') {
      whereClause.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.borrowrequest.findMany({
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
          item: {
            select: {
              itemId: true,
              title: true,
              author: true,
              isbn: true,
              imageUrl: true,
              availableCopies: true,
              totalCopies: true
            }
          }
        },
        orderBy: {
          requestedAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.borrowrequest.count({
        where: whereClause
      })
    ]);

    return NextResponse.json({
      requests,
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
    console.error('Error fetching borrow requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrow requests' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Approve or reject a borrow request
export async function PUT(request: NextRequest) {
  try {
    const { requestId, action, librarianEmail, rejectionReason } = await request.json();

    // Validate input
    if (!requestId || !action || !librarianEmail) {
      return NextResponse.json(
        { error: 'Request ID, action, and librarian email are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    const parsedRequestId = parseInt(requestId);
    if (isNaN(parsedRequestId)) {
      return NextResponse.json(
        { error: 'Request ID must be a valid number' },
        { status: 400 }
      );
    }

    // Find the borrow request
    const borrowRequest = await prisma.borrowrequest.findUnique({
      where: { requestId: parsedRequestId },
      include: {
        patron: {
          select: {
            patronId: true,
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true,
            transaction: {
              where: { isReturned: false }
            }
          }
        },
        item: {
          select: {
            itemId: true,
            title: true,
            author: true,
            availableCopies: true
          }
        }
      }
    });

    if (!borrowRequest) {
      return NextResponse.json(
        { error: 'Borrow request not found' },
        { status: 404 }
      );
    }

    if (borrowRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Additional validation for approval
      if (borrowRequest.item.availableCopies <= 0) {
        return NextResponse.json(
          { error: 'Cannot approve: Book is no longer available' },
          { status: 400 }
        );
      }

      // Check borrowing limit
      const librarySettings = await prisma.librarysettings.findFirst();
      const borrowingLimit = librarySettings?.borrowingLimit || 5;
      
      if (borrowRequest.patron.transaction.length >= borrowingLimit) {
        return NextResponse.json(
          { error: 'Cannot approve: Patron has reached borrowing limit' },
          { status: 400 }
        );
      }

      // Approve the request and create transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update the borrow request
        const updatedRequest = await tx.borrowrequest.update({
          where: { requestId: parsedRequestId },
          data: {
            status: 'APPROVED',
            processedAt: new Date(),
            processedBy: librarianEmail
          }
        });

        // Calculate due date
        const loanPeriodDays = librarySettings?.loanPeriodDays || 14;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanPeriodDays);

        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            patronId: borrowRequest.patronId,
            itemId: borrowRequest.itemId,
            dueDate: dueDate,
            isReturned: false
          }
        });

        // Update item availability
        await tx.item.update({
          where: { itemId: borrowRequest.itemId },
          data: { availableCopies: { decrement: 1 } }
        });

        // Create status history entry
        await tx.itemstatushistory.create({
          data: {
            itemId: borrowRequest.itemId,
            status: 'BORROWED',
            previousStatus: 'AVAILABLE',
            reason: 'Book approved for borrowing by librarian',
            changedBy: `librarian:${librarianEmail}`,
            notes: `Approved borrow request #${parsedRequestId} for ${borrowRequest.patron.patronFirstName} ${borrowRequest.patron.patronLastName}`
          }
        });

        // Create notification for patron
        await tx.notification.create({
          data: {
            recipientId: borrowRequest.patronId,
            recipientType: 'PATRON',
            type: 'BORROW_APPROVED',
            title: 'Borrow Request Approved!',
            message: `Great news! Your request to borrow "${borrowRequest.item.title}" has been approved. The book is now added to your borrowed books. Due date: ${dueDate.toLocaleDateString()}`,
            relatedId: transaction.transactionId,
            relatedType: 'TRANSACTION'
          }
        });

        // Create sample payments for the patron
        const currentDate = new Date();
        await tx.payment.createMany({
          data: [
            {
              patronId: borrowRequest.patronId,
              amount: 25.00,
              paymentType: 'MEMBERSHIP_FEE',
              description: 'Annual Library Membership Fee',
              transactionId: transaction.transactionId,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
              paymentStatus: 'PENDING',
              createdAt: currentDate,
              updatedAt: currentDate
            },
            {
              patronId: borrowRequest.patronId,
              amount: 5.00,
              paymentType: 'PROCESSING_FEE',
              description: 'Book Processing Fee',
              transactionId: transaction.transactionId,
              paymentStatus: 'PENDING',
              createdAt: currentDate,
              updatedAt: currentDate
            }
          ]
        });

        return { updatedRequest, transaction, dueDate };
      });

      return NextResponse.json({
        message: 'Borrow request approved successfully!',
        requestId: parsedRequestId,
        transactionId: result.transaction.transactionId,
        dueDate: result.dueDate.toISOString(),
        status: 'APPROVED'
      });

    } else { // reject
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        return NextResponse.json(
          { error: 'Rejection reason is required when rejecting a request' },
          { status: 400 }
        );
      }

      // Reject the request
      const result = await prisma.$transaction(async (tx) => {
        // Update the borrow request
        const updatedRequest = await tx.borrowrequest.update({
          where: { requestId: parsedRequestId },
          data: {
            status: 'REJECTED',
            processedAt: new Date(),
            processedBy: librarianEmail,
            rejectionReason: rejectionReason.trim()
          }
        });

        // Create notification for patron
        await tx.notification.create({
          data: {
            recipientId: borrowRequest.patronId,
            recipientType: 'PATRON',
            type: 'BORROW_REJECTED',
            title: 'Borrow Request Rejected',
            message: `Your request to borrow "${borrowRequest.item.title}" has been rejected. Reason: ${rejectionReason.trim()}`,
            relatedId: parsedRequestId,
            relatedType: 'BORROW_REQUEST'
          }
        });

        return updatedRequest;
      });

      return NextResponse.json({
        message: 'Borrow request rejected',
        requestId: parsedRequestId,
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim()
      });
    }

  } catch (error) {
    console.error('Error processing borrow request:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Borrow request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process borrow request' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
