import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const item = await prisma.item.findUnique({
      where: { itemId, isVisible: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { title, author, itemType, price, totalCopies } = body;
    
    if (!title || !author || !itemType || price === undefined || totalCopies === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, author, itemType, price, totalCopies' },
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { itemId, isVisible: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Calculate available copies based on the change in total copies
    const totalCopiesChange = parseInt(totalCopies) - existingItem.totalCopies;
    const newAvailableCopies = Math.max(0, existingItem.availableCopies + totalCopiesChange);

    // Update item
    const updatedItem = await prisma.item.update({
      where: { itemId },
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
        availableCopies: newAvailableCopies,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    
    // Handle unique constraint error for ISBN
    if (error.code === 'P2002' && error.meta?.target?.includes('isbn')) {
      return NextResponse.json(
        { error: 'An item with this ISBN already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { itemId, isVisible: true },
      include: {
        transactions: {
          where: { isReturned: false }
        },
        reservations: true
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if item has active transactions or reservations
    if (existingItem.transactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete item with active borrowings. Please ensure all copies are returned first.' },
        { status: 400 }
      );
    }

    if (existingItem.reservations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete item with active reservations. Please cancel all reservations first.' },
        { status: 400 }
      );
    }

    // Soft delete by setting isVisible to false
    const deletedItem = await prisma.item.update({
      where: { itemId },
      data: { isVisible: false },
    });

    return NextResponse.json({ 
      message: 'Item deleted successfully',
      item: deletedItem
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
