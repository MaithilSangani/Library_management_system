import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for updating books (all fields optional)
const updateBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional(),
  author: z.string().min(1, 'Author is required').max(255, 'Author is too long').optional(),
  isbn: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  itemType: z.string().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  totalCopies: z.number().int().min(1, 'Must have at least 1 copy').optional(),
  availableCopies: z.number().int().min(0, 'Available copies cannot be negative').optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNUSABLE']).optional(),
  maintenanceNotes: z.string().optional().nullable(),
  isVisible: z.boolean().optional()
});

// GET /api/admin/books/[id] - Get a specific book by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = parseInt(params.id);

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    const book = await prisma.item.findUnique({
      where: { itemId: bookId },
      include: {
        transaction: {
          include: {
            patron: {
              select: {
                patronId: true,
                patronFirstName: true,
                patronLastName: true,
                patronEmail: true
              }
            }
          },
          orderBy: { borrowedAt: 'desc' }
        },
        reservation: {
          include: {
            patron: {
              select: {
                patronId: true,
                patronFirstName: true,
                patronLastName: true,
                patronEmail: true
              }
            }
          },
          orderBy: { reservedAt: 'desc' }
        },
        borrowrequest: {
          include: {
            patron: {
              select: {
                patronId: true,
                patronFirstName: true,
                patronLastName: true,
                patronEmail: true
              }
            }
          },
          orderBy: { requestedAt: 'desc' }
        },
        itemstatushistory: {
          orderBy: { changedAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            transaction: true,
            reservation: true,
            borrowrequest: true
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Calculate additional statistics
    const activeTransactions = book.transaction.filter(t => !t.isReturned);
    const overdueTransactions = book.transaction.filter(t => 
      !t.isReturned && new Date(t.dueDate) < new Date()
    );

    const bookWithStats = {
      ...book,
      statistics: {
        totalBorrows: book._count.transaction,
        currentlyBorrowed: activeTransactions.length,
        overdueBorrows: overdueTransactions.length,
        activeReservations: book._count.reservation,
        pendingRequests: book.borrowrequest.filter(r => r.status === 'PENDING').length,
        averageRating: book.transaction.length > 0 
          ? book.transaction
              .filter(t => t.rating !== null)
              .reduce((sum, t) => sum + (t.rating || 0), 0) / 
            book.transaction.filter(t => t.rating !== null).length || 0
          : 0
      }
    };

    return NextResponse.json(bookWithStats);

  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/admin/books/[id] - Update a specific book by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = parseInt(params.id);

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input data
    const validationResult = updateBookSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if book exists
    const existingBook = await prisma.item.findUnique({
      where: { itemId: bookId }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check for duplicate ISBN if being updated
    if (updateData.isbn && updateData.isbn !== existingBook.isbn) {
      const duplicateBook = await prisma.item.findUnique({
        where: { isbn: updateData.isbn }
      });

      if (duplicateBook) {
        return NextResponse.json(
          { error: 'A book with this ISBN already exists' },
          { status: 409 }
        );
      }
    }

    // Ensure availableCopies doesn't exceed totalCopies
    if (updateData.totalCopies !== undefined && updateData.availableCopies !== undefined) {
      if (updateData.availableCopies > updateData.totalCopies) {
        updateData.availableCopies = updateData.totalCopies;
      }
    } else if (updateData.totalCopies !== undefined) {
      // If only totalCopies is being updated, adjust availableCopies if necessary
      if (existingBook.availableCopies > updateData.totalCopies) {
        updateData.availableCopies = updateData.totalCopies;
      }
    } else if (updateData.availableCopies !== undefined) {
      // If only availableCopies is being updated, ensure it doesn't exceed current totalCopies
      if (updateData.availableCopies > existingBook.totalCopies) {
        updateData.availableCopies = existingBook.totalCopies;
      }
    }

    // Update the book
    const updatedBook = await prisma.item.update({
      where: { itemId: bookId },
      data: updateData,
      include: {
        _count: {
          select: {
            transaction: true,
            reservation: true,
            borrowrequest: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Book updated successfully',
      book: updatedBook
    });

  } catch (error) {
    console.error('Error updating book:', error);
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A book with this ISBN already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/admin/books/[id] - Delete a specific book by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = parseInt(params.id);

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    // Check if book exists and get related data
    const existingBook = await prisma.item.findUnique({
      where: { itemId: bookId },
      include: {
        transaction: true,
        reservation: true,
        borrowrequest: true,
        itemstatushistory: true
      }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check for active transactions (prevent deletion if book is currently borrowed)
    const activeTransactions = existingBook.transaction.filter(t => !t.isReturned);
    if (activeTransactions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete book with active borrows',
          details: `This book has ${activeTransactions.length} active transaction(s). Please ensure all copies are returned before deletion.`
        },
        { status: 409 }
      );
    }

    // Check for active reservations
    if (existingBook.reservation.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete book with active reservations',
          details: `This book has ${existingBook.reservation.length} active reservation(s). Please cancel all reservations before deletion.`
        },
        { status: 409 }
      );
    }

    // Check for pending borrow requests
    const pendingRequests = existingBook.borrowrequest.filter(r => r.status === 'PENDING');
    if (pendingRequests.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete book with pending requests',
          details: `This book has ${pendingRequests.length} pending borrow request(s). Please process all requests before deletion.`
        },
        { status: 409 }
      );
    }

    // If we get here, it's safe to delete the book
    // Note: Related records will be handled by the database cascade rules
    await prisma.item.delete({
      where: { itemId: bookId }
    });

    return NextResponse.json({
      message: 'Book deleted successfully',
      deletedBook: {
        itemId: existingBook.itemId,
        title: existingBook.title,
        author: existingBook.author,
        isbn: existingBook.isbn
      }
    });

  } catch (error) {
    console.error('Error deleting book:', error);
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          error: 'Cannot delete book due to existing references',
          details: 'This book has historical data that cannot be removed. Consider marking it as inactive instead.'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
