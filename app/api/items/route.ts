import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ItemStatus } from '@/app/generated/prisma';
import { calculateItemStatus, getStatusStatistics, filterItemsByStatus, type ItemWithRelations } from '@/app/lib/itemStatus';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const itemType = searchParams.get('itemType') || '';
    const subject = searchParams.get('subject') || '';
    const status = searchParams.get('status') as ItemStatus | null;
    const includeStats = searchParams.get('includeStats') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { keywords: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (itemType) {
      whereClause.itemType = { equals: itemType };
    }
    
    if (subject) {
      whereClause.subject = { contains: subject, mode: 'insensitive' };
    }
    
    // Only get visible items
    whereClause.isVisible = true;

    // Get items with relations for status calculation
    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        transaction: {
          select: {
            transactionId: true,
            isReturned: true,
            dueDate: true,
            borrowedAt: true,
            returnedAt: true,
          }
        },
        reservation: {
          select: {
            reservationId: true,
            reservedAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }) as ItemWithRelations[];

    // Filter by status if specified
    let filteredItems = items;
    if (status) {
      filteredItems = filterItemsByStatus(items, status);
    }

    // Apply pagination to filtered items
    const totalFilteredCount = filteredItems.length;
    const paginatedItems = filteredItems.slice(skip, skip + limit);

    // Calculate status for each item
    const itemsWithStatus = paginatedItems.map(item => {
      const statusInfo = calculateItemStatus(item);
      return {
        ...item,
        statusInfo
      };
    });

    // Get filter options
    const [subjects, itemTypes] = await Promise.all([
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

    const response: any = {
      items: itemsWithStatus,
      pagination: {
        page,
        limit,
        totalCount: totalFilteredCount,
        totalPages: Math.ceil(totalFilteredCount / limit),
        hasNext: page < Math.ceil(totalFilteredCount / limit),
        hasPrev: page > 1
      },
      filters: {
        subjects: subjects.map(s => s.subject).filter(Boolean),
        itemTypes: itemTypes.map(t => t.itemType).filter(Boolean),
        availableStatuses: Object.values(ItemStatus)
      }
    };

    // Include statistics if requested
    if (includeStats) {
      response.statistics = getStatusStatistics(items);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { title, author, itemType, price, totalCopies } = body;
    
    if (!title || !author || !itemType || !price || !totalCopies) {
      return NextResponse.json(
        { error: 'Missing required fields: title, author, itemType, price, totalCopies' },
        { status: 400 }
      );
    }

    // Create new item
    const newItem = await prisma.item.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        isbn: body.isbn?.trim() || null,
        subject: body.subject?.trim() || null,
        keywords: body.keywords?.trim() || null,
        itemType: itemType.trim(),
        price: parseFloat(price),
        imageUrl: body.imageUrl?.trim() || null,
        totalCopies: parseInt(totalCopies),
        availableCopies: parseInt(totalCopies), // Initially all copies are available
        isVisible: true,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    
    // Handle unique constraint error for ISBN
    if (error.code === 'P2002' && error.meta?.target?.includes('isbn')) {
      return NextResponse.json(
        { error: 'An item with this ISBN already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
