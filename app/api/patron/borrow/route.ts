import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

const prisma = new PrismaClient();

// POST: Create a book borrowing request
export async function POST(request: NextRequest) {
  try {
    const { itemId, patronId } = await request.json();

    // Validate required fields
    if (!itemId || !patronId) {
      return NextResponse.json(
        { error: 'Item ID and Patron ID are required' },
        { status: 400 }
      );
    }

    // Validate that itemId and patronId are valid numbers
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
        }
      }
    });

    if (!patron) {
      return NextResponse.json(
        { error: 'Patron not found' },
        { status: 404 }
      );
    }

    // Get library settings for borrowing limit
    const librarySettings = await prisma.librarysettings.findFirst();
    const borrowingLimit = librarySettings?.borrowingLimit || 5;

    // Check borrowing limit
    if (patron.transaction.length >= borrowingLimit) {
      return NextResponse.json(
        { error: `You have reached your borrowing limit of ${borrowingLimit} books` },
        { status: 400 }
      );
    }

    // Check if item exists and is available
    const item = await prisma.item.findUnique({
      where: { 
        itemId: parsedItemId,
        isVisible: true  // Only find visible (non-deleted) items
      }
    });

    if (!item) {
      // Check if item exists but is soft-deleted
      const deletedItem = await prisma.item.findUnique({
        where: { itemId: parsedItemId }
      });
      
      if (deletedItem && !deletedItem.isVisible) {
        return NextResponse.json(
          { error: 'This item is no longer available in the library catalog' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `Item with ID ${parsedItemId} not found. Please verify the item ID and try again.` },
        { status: 404 }
      );
    }

    if (item.availableCopies <= 0) {
      return NextResponse.json(
        { error: 'This book is currently unavailable' },
        { status: 400 }
      );
    }

    // Check if patron already has this book
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

    // Calculate due date using library settings
    const loanPeriodDays = librarySettings?.loanPeriodDays || 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanPeriodDays);

    // Create the transaction and update book availability
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          patronId: parsedPatronId,
          itemId: parsedItemId,
          dueDate: dueDate,
          isReturned: false
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

      // Update item availability
      await tx.item.update({
        where: { itemId: parsedItemId },
        data: { availableCopies: { decrement: 1 } }
      });

      // Create status history entry
      await tx.itemStatusHistory.create({
        data: {
          itemId: parsedItemId,
          status: 'BORROWED',
          previousStatus: 'AVAILABLE',
          reason: 'Book borrowed by patron',
          changedBy: `patron:${patron.patronEmail}`,
          notes: `Self-service borrow by ${patron.patronFirstName} ${patron.patronLastName}`
        }
      });

      return newTransaction;
    });

    // Create sample payments for the patron (membership fee, processing fee)
    await prisma.payment.createMany({
      data: [
        {
          patronId: parsedPatronId,
          amount: 25.00,
          paymentType: 'MEMBERSHIP_FEE',
          description: 'Annual Library Membership Fee',
          transactionId: result.transactionId,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
          paymentStatus: 'PENDING'
        },
        {
          patronId: parsedPatronId,
          amount: 5.00,
          paymentType: 'PROCESSING_FEE',
          description: 'Book Processing Fee',
          transactionId: result.transactionId,
          paymentStatus: 'PENDING'
        }
      ]
    });

    return NextResponse.json({
      message: 'Book borrowed successfully!',
      transaction: result,
      dueDate: dueDate.toISOString(),
      redirectTo: '/patron/payments',
      paymentsCreated: [
        { type: 'MEMBERSHIP_FEE', amount: 25.00, description: 'Annual Library Membership Fee' },
        { type: 'PROCESSING_FEE', amount: 5.00, description: 'Book Processing Fee' }
      ]
    });
  } catch (error) {
    console.error('Error borrowing book:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item or patron not found in database' },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This borrowing transaction already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to borrow book. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
