import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - Get individual patron by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patronId = parseInt(params.id);
    
    if (isNaN(patronId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patron ID' },
        { status: 400 }
      );
    }

    const patron = await prisma.patron.findUnique({
      where: { patronId: patronId },
      include: {
        transaction: {
          include: {
            item: {
              select: {
                title: true,
                author: true,
                isbn: true
              }
            }
          },
          orderBy: { borrowedAt: 'desc' }
        },
        reservation: {
          include: {
            item: {
              select: {
                title: true,
                author: true,
                isbn: true
              }
            }
          },
          orderBy: { reservedAt: 'desc' }
        },
        student: true,
        faculty: true
      }
    });

    if (!patron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found' },
        { status: 404 }
      );
    }

    // Transform patron data
    const patronWithDetails = {
      id: patron.patronId,
      firstName: patron.patronFirstName,
      lastName: patron.patronLastName,
      email: patron.patronEmail,
      phone: undefined,
      address: undefined,
      studentId: patron.student?.studentEnrollmentNumber ? String(patron.student.studentEnrollmentNumber) : undefined,
      employeeId: undefined,
      isStudent: patron.isStudent,
      isFaculty: patron.isFaculty,
      isSuspended: false,
      createdAt: patron.patronCreatedAt.toISOString(),
      updatedAt: patron.patronUpdatedAt.toISOString(),
      // Statistics
      activeTransactions: patron.transaction.filter(t => !t.isReturned).length,
      totalTransactions: patron.transaction.length,
      overdueTransactions: patron.transaction.filter(t => 
        !t.isReturned && new Date(t.dueDate) < new Date()
      ).length,
      activeReservations: patron.reservation.length,
      totalReservations: patron.reservation.length,
      // Detailed records
      transactions: patron.transaction.map(t => ({
        id: t.transactionId,
        itemTitle: t.item.title,
        itemAuthor: t.item.author,
        itemIsbn: t.item.isbn,
        issuedDate: t.borrowedAt,
        dueDate: t.dueDate,
        returnedDate: t.returnedAt,
        isReturned: t.isReturned,
        fine: t.finePaid,
        isOverdue: !t.isReturned && new Date(t.dueDate) < new Date()
      })),
      reservations: patron.reservation.map(r => ({
        id: r.reservationId,
        itemTitle: r.item.title,
        itemAuthor: r.item.author,
        itemIsbn: r.item.isbn,
        reservedDate: r.reservedAt,
        status: 'ACTIVE', // no status field in schema
        expiryDate: undefined // no expiry field in schema
      }))
    };

    return NextResponse.json({
      success: true,
      data: patronWithDetails
    });

  } catch (error) {
    console.error('Error fetching patron:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch patron',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update patron
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patronId = parseInt(params.id);
    
    if (isNaN(patronId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patron ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      password,
      isStudent,
      isFaculty,
      studentId,
      employeeId,
      isSuspended
    } = body;

    // Check if patron exists
    const existingPatron = await prisma.patron.findUnique({
      where: { patronId: patronId }
    });

    if (!existingPatron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found' },
        { status: 404 }
      );
    }

    // Check for email conflicts (if email is being changed)
    if (email && email !== existingPatron.patronEmail) {
      const emailConflict = await prisma.patron.findUnique({
        where: { patronEmail: email }
      });
      if (emailConflict) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another patron' },
          { status: 409 }
        );
      }
    }

    // Note: Schema has no studentId/employeeId fields; skipping these checks

    // Prepare update data
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.patronFirstName = firstName;
    if (lastName !== undefined) updateData.patronLastName = lastName;
    if (email !== undefined) updateData.patronEmail = email;
    // Note: phone, address, studentId, employeeId, isSuspended fields don't exist in schema
    if (isStudent !== undefined) updateData.isStudent = isStudent;
    if (isFaculty !== undefined) updateData.isFaculty = isFaculty;

    // Hash password if provided
    if (password) {
      updateData.patronPassword = await bcrypt.hash(password, 12);
    }

    // Update patron
    const updatedPatron = await prisma.patron.update({
      where: { patronId: patronId },
      data: updateData,
      include: {
        transaction: {
          select: {
            transactionId: true,
            isReturned: true,
            dueDate: true
          }
        },
        reservation: {
          select: {
            reservationId: true
          }
        },
        student: true,
        faculty: true
      }
    });

    // Transform response
    const patronWithStats = {
      id: updatedPatron.patronId,
      firstName: updatedPatron.patronFirstName,
      lastName: updatedPatron.patronLastName,
      email: updatedPatron.patronEmail,
      phone: undefined,
      address: undefined,
      studentId: updatedPatron.student?.studentEnrollmentNumber ? String(updatedPatron.student.studentEnrollmentNumber) : undefined,
      employeeId: undefined,
      isStudent: updatedPatron.isStudent,
      isFaculty: updatedPatron.isFaculty,
      isSuspended: false,
      createdAt: updatedPatron.patronCreatedAt.toISOString(),
      updatedAt: updatedPatron.patronUpdatedAt.toISOString(),
      activeTransactions: updatedPatron.transaction.filter(t => !t.isReturned).length,
      totalTransactions: updatedPatron.transaction.length,
      overdueTransactions: updatedPatron.transaction.filter(t => 
        !t.isReturned && new Date(t.dueDate) < new Date()
      ).length,
      activeReservations: updatedPatron.reservation.length,
      totalReservations: updatedPatron.reservation.length
    };

    return NextResponse.json({
      success: true,
      data: patronWithStats,
      message: 'Patron updated successfully'
    });

  } catch (error) {
    console.error('Error updating patron:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update patron',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete patron
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patronId = parseInt(params.id);
    
    if (isNaN(patronId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patron ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const force = (searchParams.get('force') || '').toLowerCase() === 'true';

    // Check if patron exists
    const existingPatron = await prisma.patron.findUnique({
      where: { patronId: patronId },
      include: {
        transaction: true,
        reservation: true,
        student: true,
        faculty: true
      }
    });

    if (!existingPatron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found' },
        { status: 404 }
      );
    }

    // If not forcing, block deletion if there are active transactions or reservations
    if (!force) {
      const hasActiveTransactions = existingPatron.transaction.some(t => !t.isReturned);
      if (hasActiveTransactions) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete patron with active transactions. Please return all books first.' 
          },
          { status: 409 }
        );
      }
      if (existingPatron.reservation.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete patron with active reservations. Please cancel reservations first.' 
          },
          { status: 409 }
        );
      }
    }

    // Manually delete dependent records to satisfy FK constraints
    await prisma.$transaction([
      // Notifications addressed to this patron
      prisma.notification.deleteMany({ where: { recipientId: patronId } }),
      // Borrow requests by this patron
      prisma.borrowrequest.deleteMany({ where: { patronId } }),
      // Reservations by this patron
      prisma.reservation.deleteMany({ where: { patronId } }),
      // Transactions by this patron
      prisma.transaction.deleteMany({ where: { patronId } }),
      // Student/faculty profiles
      prisma.student.deleteMany({ where: { patronId } }),
      prisma.faculty.deleteMany({ where: { patronId } })
    ]);

    // Finally delete patron
    await prisma.patron.delete({ where: { patronId } });

    return NextResponse.json({
      success: true,
      message: 'Patron deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting patron:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete patron',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
