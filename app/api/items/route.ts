import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateItemStatus, getStatusStatistics, filterItemsByStatus, type ItemWithRelations, ItemStatus } from '@/app/lib/itemStatus';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const itemType = searchParams.get('itemType') || '';
    const subject = searchParams.get('subject') || '';
    const status = searchParams.get('status') as ItemStatus | null;
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (search) {
      const searchTerm = search.trim();
      if (searchTerm) {
        // For case-insensitive search, we'll use multiple variations
        const searchLower = searchTerm.toLowerCase();
        const searchUpper = searchTerm.toUpperCase();
        const searchCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
        
        whereClause.OR = [
          { title: { contains: searchTerm } },
          { title: { contains: searchLower } },
          { title: { contains: searchUpper } },
          { title: { contains: searchCapitalized } },
          { author: { contains: searchTerm } },
          { author: { contains: searchLower } },
          { author: { contains: searchUpper } },
          { author: { contains: searchCapitalized } },
          { isbn: { contains: searchTerm } },
          { keywords: { contains: searchTerm } },
          { keywords: { contains: searchLower } },
          { subject: { contains: searchTerm } },
          { subject: { contains: searchLower } },
          { subject: { contains: searchCapitalized } }
        ];
      }
    }
    
    if (itemType) {
      whereClause.itemType = { equals: itemType };
    }
    
    if (subject) {
      whereClause.subject = { contains: subject };
    }
    
    // Only get visible items
    whereClause.isVisible = true;
    
    // Filter for available items only if requested
    if (availableOnly) {
      whereClause.availableCopies = { gt: 0 };
    }

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

    // Map items to match the patron browse page structure
    const mappedItems = itemsWithStatus.map(item => ({
      itemId: item.itemId,
      title: item.title,
      author: item.author,
      isbn: item.isbn,
      publisher: null, // Not available in current schema
      publishedDate: null, // Not available in current schema
      pages: null, // Not available in current schema
      language: 'English', // Default value
      genre: item.subject,
      description: null, // Not available in current schema
      subject: item.subject,
      itemType: item.itemType,
      price: item.price,
      imageUrl: item.imageUrl,
      totalCopies: item.totalCopies,
      availableCopies: item.availableCopies,
      condition: item.condition,
      location: 'Main Library', // Default value
      addedDate: item.createdAt?.toISOString(),
      lastUpdated: item.updatedAt?.toISOString(),
      isAvailable: item.availableCopies > 0,
      status: item.availableCopies > 0 ? 'AVAILABLE' : 'BORROWED'
    }));

    // Get additional filter options for patron page compatibility
    const [languages, conditions, locations] = await Promise.all([
      // Languages - using default values since not in schema
      Promise.resolve(['English', 'Spanish', 'French']),
      // Conditions - get from enum values
      Promise.resolve(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
      // Locations - using default values since not in schema  
      Promise.resolve(['Main Library', 'Reference Section', 'Periodicals'])
    ]);

    const response: any = {
      items: mappedItems,
      pagination: {
        page,
        limit,
        total: totalFilteredCount, // Change from totalCount to total
        pages: Math.ceil(totalFilteredCount / limit), // Change from totalPages to pages
        hasNext: page < Math.ceil(totalFilteredCount / limit),
        hasPrev: page > 1
      },
      filters: {
        categories: subjects.map(s => s.subject).filter(Boolean),
        subjects: subjects.map(s => s.subject).filter(Boolean),
        itemTypes: itemTypes.map(t => t.itemType).filter(Boolean),
        languages: languages,
        conditions: conditions,
        locations: locations
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
    const { title, author, itemType, price, totalCopies, condition } = body;
    
    if (!title || !author || !itemType || !price || !totalCopies || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields: title, author, itemType, price, totalCopies, condition' },
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
        condition: condition.trim(),
        maintenanceNotes: body.maintenanceNotes?.trim() || null,
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
