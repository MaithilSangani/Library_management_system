import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all books for catalog browsing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const itemType = searchParams.get('itemType');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    let whereClause: any = {
      isVisible: true
    };

    // Search functionality
    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          author: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          isbn: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          subject: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          keywords: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Category filter
    if (category) {
      whereClause.subject = category;
    }

    // Item type filter
    if (itemType) {
      whereClause.itemType = itemType;
    }

    // Available only filter
    if (availableOnly) {
      whereClause.availableCopies = {
        gt: 0
      };
    }

    // Fetch books with pagination
    const [books, totalCount] = await Promise.all([
      prisma.item.findMany({
        where: whereClause,
        select: {
          itemId: true,
          title: true,
          author: true,
          isbn: true,
          subject: true,
          itemType: true,
          price: true,
          imageUrl: true,
          totalCopies: true,
          availableCopies: true,
          condition: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { createdAt: 'desc' },
          { title: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.item.count({
        where: whereClause
      })
    ]);

    // Get unique categories and item types for filtering
    const [categories, itemTypes] = await Promise.all([
      prisma.item.findMany({
        where: { isVisible: true },
        select: { subject: true },
        distinct: ['subject']
      }),
      prisma.item.findMany({
        where: { isVisible: true },
        select: { itemType: true },
        distinct: ['itemType']
      })
    ]);

    // Format the response
    const formattedBooks = books.map(book => ({
      ...book,
      isAvailable: book.availableCopies > 0,
      availabilityStatus: book.availableCopies > 0 
        ? `${book.availableCopies} of ${book.totalCopies} available`
        : 'Out of stock',
      status: book.availableCopies > 0 ? 'Available' : 'Unavailable'
    }));

    const response = {
      books: formattedBooks,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        categories: categories.map(c => c.subject).filter(Boolean).sort(),
        itemTypes: itemTypes.map(t => t.itemType).filter(Boolean).sort()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalog data' },
      { status: 500 }
    );
  }
}
