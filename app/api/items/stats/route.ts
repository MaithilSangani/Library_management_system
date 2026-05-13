import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get all statistics in parallel for better performance
    const [
      totalItems,
      totalCopiesResult,
      availableCopiesResult,
      outOfStockItems
    ] = await Promise.all([
      // Total number of visible items
      prisma.item.count({
        where: { isVisible: true }
      }),
      
      // Sum of all total copies
      prisma.item.aggregate({
        where: { isVisible: true },
        _sum: {
          totalCopies: true
        }
      }),
      
      // Sum of all available copies
      prisma.item.aggregate({
        where: { isVisible: true },
        _sum: {
          availableCopies: true
        }
      }),
      
      // Count of items that are out of stock (0 available copies)
      prisma.item.count({
        where: {
          isVisible: true,
          availableCopies: 0
        }
      })
    ]);

    const stats = {
      totalItems,
      totalCopies: totalCopiesResult._sum.totalCopies || 0,
      availableCopies: availableCopiesResult._sum.availableCopies || 0,
      outOfStockItems,
      // Calculate borrowed copies (Total - Available)
      borrowedCopies: (totalCopiesResult._sum.totalCopies || 0) - (availableCopiesResult._sum.availableCopies || 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching library statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
