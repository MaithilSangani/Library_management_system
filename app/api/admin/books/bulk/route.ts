import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ItemCondition } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for bulk book import
const bulkImportSchema = z.array(
  z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
    author: z.string().min(1, 'Author is required').max(255, 'Author is too long'),
    isbn: z.string().optional().nullable(),
    subject: z.string().optional().nullable(),
    keywords: z.string().optional().nullable(),
    itemType: z.string().default('BOOK'),
    price: z.number().min(0, 'Price must be positive'),
    imageUrl: z.string().url().optional().nullable().or(z.literal('')),
    totalCopies: z.number().int().min(1, 'Must have at least 1 copy').default(1),
    availableCopies: z.number().int().min(0, 'Available copies cannot be negative').optional(),
    condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNUSABLE']).default('EXCELLENT'),
    maintenanceNotes: z.string().optional().nullable(),
    isVisible: z.boolean().default(true)
  })
);

// Schema for bulk operations
const bulkActionSchema = z.object({
  action: z.enum(['DELETE', 'UPDATE_VISIBILITY', 'UPDATE_CONDITION', 'EXPORT']),
  itemIds: z.array(z.number().int()).min(1, 'At least one item must be selected'),
  updateData: z.object({
    isVisible: z.boolean().optional(),
    condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNUSABLE']).optional(),
    maintenanceNotes: z.string().optional().nullable()
  }).optional()
});

// POST /api/admin/books/bulk - Handle bulk operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is an import operation or a bulk action
    if (Array.isArray(body)) {
      return await handleBulkImport(body);
    } else {
      return await handleBulkAction(body);
    }
    
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Handle bulk import of books
async function handleBulkImport(data: any[]) {
  try {
    // Validate the import data
    const validationResult = bulkImportSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const booksToImport = validationResult.data;
    const results = {
      imported: [] as any[],
      failed: [] as any[],
      duplicates: [] as any[]
    };

    // Process each book individually to handle errors gracefully
    for (let i = 0; i < booksToImport.length; i++) {
      const bookData = booksToImport[i];
      
      try {
        // Set availableCopies to totalCopies if not specified
        if (bookData.availableCopies === undefined) {
          bookData.availableCopies = bookData.totalCopies;
        }

        // Ensure availableCopies doesn't exceed totalCopies
        if (bookData.availableCopies > bookData.totalCopies) {
          bookData.availableCopies = bookData.totalCopies;
        }

        // Check for duplicate ISBN
        if (bookData.isbn) {
          const existingBook = await prisma.item.findUnique({
            where: { isbn: bookData.isbn }
          });

          if (existingBook) {
            results.duplicates.push({
              index: i + 1,
              title: bookData.title,
              isbn: bookData.isbn,
              reason: 'ISBN already exists'
            });
            continue;
          }
        }

        // Create the book
        const newBook = await prisma.item.create({
          data: bookData
        });

        results.imported.push({
          index: i + 1,
          itemId: newBook.itemId,
          title: newBook.title,
          author: newBook.author
        });

      } catch (error) {
        console.error(`Error importing book at index ${i + 1}:`, error);
        results.failed.push({
          index: i + 1,
          title: bookData.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Bulk import completed. ${results.imported.length} books imported successfully.`,
      results,
      summary: {
        total: booksToImport.length,
        imported: results.imported.length,
        failed: results.failed.length,
        duplicates: results.duplicates.length
      }
    });

  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}

// Handle bulk actions (delete, update, etc.)
async function handleBulkAction(body: any) {
  try {
    // Validate the bulk action data
    const validationResult = bulkActionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { action, itemIds, updateData } = validationResult.data;

    switch (action) {
      case 'DELETE':
        return await handleBulkDelete(itemIds);
        
      case 'UPDATE_VISIBILITY':
        if (!updateData?.hasOwnProperty('isVisible')) {
          return NextResponse.json(
            { error: 'isVisible value is required for visibility update' },
            { status: 400 }
          );
        }
        return await handleBulkUpdate(itemIds, { isVisible: updateData.isVisible });
        
      case 'UPDATE_CONDITION':
        if (!updateData?.condition) {
          return NextResponse.json(
            { error: 'condition value is required for condition update' },
            { status: 400 }
          );
        }
        return await handleBulkUpdate(itemIds, { 
          condition: updateData.condition,
          maintenanceNotes: updateData.maintenanceNotes 
        });
        
      case 'EXPORT':
        return await handleBulkExport(itemIds);
        
      default:
        return NextResponse.json(
          { error: 'Invalid bulk action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk action' },
      { status: 500 }
    );
  }
}

// Handle bulk delete
async function handleBulkDelete(itemIds: number[]) {
  const results = {
    deleted: [] as any[],
    failed: [] as any[]
  };

  for (const itemId of itemIds) {
    try {
      // Check if book exists and has active transactions
      const existingBook = await prisma.item.findUnique({
        where: { itemId },
        include: {
          transaction: true,
          reservation: true,
          borrowrequest: true
        }
      });

      if (!existingBook) {
        results.failed.push({
          itemId,
          reason: 'Book not found'
        });
        continue;
      }

      // Check for active transactions
      const activeTransactions = existingBook.transaction.filter(t => !t.isReturned);
      if (activeTransactions.length > 0) {
        results.failed.push({
          itemId,
          title: existingBook.title,
          reason: `Has ${activeTransactions.length} active transaction(s)`
        });
        continue;
      }

      // Check for active reservations
      if (existingBook.reservation.length > 0) {
        results.failed.push({
          itemId,
          title: existingBook.title,
          reason: `Has ${existingBook.reservation.length} active reservation(s)`
        });
        continue;
      }

      // Check for pending requests
      const pendingRequests = existingBook.borrowrequest.filter(r => r.status === 'PENDING');
      if (pendingRequests.length > 0) {
        results.failed.push({
          itemId,
          title: existingBook.title,
          reason: `Has ${pendingRequests.length} pending request(s)`
        });
        continue;
      }

      // Safe to delete
      await prisma.item.delete({ where: { itemId } });
      results.deleted.push({
        itemId,
        title: existingBook.title,
        author: existingBook.author
      });

    } catch (error) {
      console.error(`Error deleting book ${itemId}:`, error);
      results.failed.push({
        itemId,
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    message: `Bulk delete completed. ${results.deleted.length} books deleted successfully.`,
    results,
    summary: {
      total: itemIds.length,
      deleted: results.deleted.length,
      failed: results.failed.length
    }
  });
}

// Handle bulk update
async function handleBulkUpdate(itemIds: number[], updateData: any) {
  const results = {
    updated: [] as any[],
    failed: [] as any[]
  };

  for (const itemId of itemIds) {
    try {
      const updatedBook = await prisma.item.update({
        where: { itemId },
        data: updateData
      });

      results.updated.push({
        itemId,
        title: updatedBook.title,
        author: updatedBook.author
      });

    } catch (error) {
      console.error(`Error updating book ${itemId}:`, error);
      results.failed.push({
        itemId,
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    message: `Bulk update completed. ${results.updated.length} books updated successfully.`,
    results,
    summary: {
      total: itemIds.length,
      updated: results.updated.length,
      failed: results.failed.length
    }
  });
}

// Handle bulk export
async function handleBulkExport(itemIds: number[]) {
  try {
    const books = await prisma.item.findMany({
      where: {
        itemId: { in: itemIds }
      },
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

    // Format the data for export
    const exportData = books.map(book => ({
      itemId: book.itemId,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      subject: book.subject,
      keywords: book.keywords,
      itemType: book.itemType,
      price: book.price,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      condition: book.condition,
      isVisible: book.isVisible,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      totalBorrows: book._count.transaction,
      activeReservations: book._count.reservation,
      pendingRequests: book._count.borrowrequest
    }));

    return NextResponse.json({
      message: `${books.length} books exported successfully`,
      data: exportData,
      exportInfo: {
        totalBooks: books.length,
        exportedAt: new Date().toISOString(),
        format: 'JSON'
      }
    });

  } catch (error) {
    console.error('Error in bulk export:', error);
    return NextResponse.json(
      { error: 'Failed to export books' },
      { status: 500 }
    );
  }
}
