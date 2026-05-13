import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Search available books for issuing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const availableOnly = searchParams.get('available') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    let whereClause: any = {
      isVisible: true,
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          author: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          isbn: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          subject: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          keywords: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    };

    // Filter for available books only if requested
    if (availableOnly) {
      whereClause.availableCopies = {
        gt: 0
      };
    }

    const items = await prisma.item.findMany({
      where: whereClause,
      select: {
        itemId: true,
        title: true,
        author: true,
        isbn: true,
        subject: true,
        itemType: true,
        totalCopies: true,
        availableCopies: true,
        condition: true,
        imageUrl: true,
        price: true
      },
      take: limit,
      orderBy: [
        { title: 'asc' }
      ]
    });

    // Format the response to include availability status
    const formattedItems = items.map(item => ({
      itemId: item.itemId,
      title: item.title,
      author: item.author,
      isbn: item.isbn,
      subject: item.subject,
      itemType: item.itemType,
      totalCopies: item.totalCopies,
      availableCopies: item.availableCopies,
      condition: item.condition,
      imageUrl: item.imageUrl,
      price: item.price,
      isAvailable: item.availableCopies > 0,
      isInWishlist: false, // This would be checked against user's wishlist in production
      availabilityStatus: item.availableCopies > 0 
        ? `${item.availableCopies} of ${item.totalCopies} available`
        : 'Out of stock'
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Error searching books:', error);
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    );
  }
}
