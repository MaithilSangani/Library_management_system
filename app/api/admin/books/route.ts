import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ItemCondition } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for creating/updating books
const bookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  author: z.string().min(1, 'Author is required').max(255, 'Author is too long'),
  isbn: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  itemType: z.string().default('BOOK'),
  price: z.number().min(0, 'Price must be positive'),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  totalCopies: z.number().int().min(1, 'Must have at least 1 copy'),
  availableCopies: z.number().int().min(0, 'Available copies cannot be negative'),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNUSABLE']).default('EXCELLENT'),
  maintenanceNotes: z.string().optional().nullable(),
  isVisible: z.boolean().default(true)
});

// GET /api/admin/books - Get all books with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Search and filter parameters
    const search = searchParams.get('search') || '';
    const itemType = searchParams.get('itemType') || '';
    const condition = searchParams.get('condition') || '';
    const availability = searchParams.get('availability') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { keywords: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (itemType && itemType !== 'ALL') {
      whereClause.itemType = itemType;
    }
    
    if (condition && condition !== 'ALL') {
      whereClause.condition = condition as ItemCondition;
    }
    
    if (availability === 'AVAILABLE') {
      whereClause.availableCopies = { gt: 0 };
      whereClause.isVisible = true;
    } else if (availability === 'UNAVAILABLE') {
      whereClause.availableCopies = 0;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get books with pagination
    const [books, totalCount] = await Promise.all([
      prisma.item.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              transaction: true,
              reservation: true,
              borrowrequest: true
            }
          }
        }
      }),
      prisma.item.count({ where: whereClause })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Get summary statistics
    const statistics = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { availableCopies: { gt: 0 }, isVisible: true } }),
      prisma.item.count({ where: { availableCopies: 0 } }),
      prisma.item.aggregate({
        _sum: { totalCopies: true, availableCopies: true }
      })
    ]);

    const response = {
      books,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage
      },
      statistics: {
        totalItems: statistics[0],
        availableItems: statistics[1],
        unavailableItems: statistics[2],
        totalCopies: statistics[3]._sum.totalCopies || 0,
        availableCopies: statistics[3]._sum.availableCopies || 0
      },
      filters: {
        search,
        itemType,
        condition,
        availability,
        sortBy,
        sortOrder
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch books',
        books: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/books - Create a new book
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = bookSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const bookData = validationResult.data;

    // Check for duplicate ISBN if provided
    if (bookData.isbn) {
      const existingBook = await prisma.item.findUnique({
        where: { isbn: bookData.isbn }
      });

      if (existingBook) {
        return NextResponse.json(
          { error: 'A book with this ISBN already exists' },
          { status: 409 }
        );
      }
    }

    // Ensure availableCopies doesn't exceed totalCopies
    if (bookData.availableCopies > bookData.totalCopies) {
      bookData.availableCopies = bookData.totalCopies;
    }

    // Create the book
    const newBook = await prisma.item.create({
      data: bookData,
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

    return NextResponse.json(
      {
        message: 'Book created successfully',
        book: newBook
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating book:', error);
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A book with this ISBN already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
