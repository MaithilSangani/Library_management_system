import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to get user from token
function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : 
                request.cookies.get('auth-token')?.value || 
                request.headers.get('x-auth-token');

  if (!token) {
    // For demo purposes, return a mock user if no token
    return { patronId: 1, email: 'demo@example.com' };
  }

  try {
    // In production, verify with your JWT secret
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // For now, return mock user
    return { patronId: 1, email: 'demo@example.com' };
  } catch (error) {
    return null;
  }
}

// PUT /api/patron/borrowing/[id]/rate - Rate a borrowed book
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const borrowingId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify that this borrowing belongs to the current patron
    const transaction = await prisma.transaction.findFirst({
      where: {
        transactionId: borrowingId,
        patronId: user.patronId
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Borrowing record not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the transaction with rating and review
    const updatedTransaction = await prisma.transaction.update({
      where: {
        transactionId: borrowingId
      },
      data: {
        rating,
        review: review || null
      },
      include: {
        item: {
          select: {
            title: true,
            author: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Rating saved successfully',
      rating: updatedTransaction.rating,
      review: updatedTransaction.review,
      book: {
        title: updatedTransaction.item.title,
        author: updatedTransaction.item.author
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error rating book:', error);
    return NextResponse.json(
      { error: 'Failed to save rating' },
      { status: 500 }
    );
  }
}
