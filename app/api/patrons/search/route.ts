import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Search patrons (students and faculty)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'student', 'faculty', or null for both
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    let whereClause: any = {
      OR: [
        {
          patronFirstName: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          patronLastName: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          patronEmail: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    };

    // Filter by patron type if specified
    if (type === 'student') {
      whereClause.isStudent = true;
    } else if (type === 'faculty') {
      whereClause.isFaculty = true;
    }

    const patrons = await prisma.patron.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            studentDepartment: true,
            studentSemester: true,
            studentRollNo: true,
            studentEnrollmentNumber: true
          }
        },
        faculty: {
          select: {
            facultyDepartment: true
          }
        },
        transaction: {
          where: { isReturned: false },
          select: {
            transactionId: true,
            item: {
              select: {
                title: true
              }
            }
          }
        }
      },
      take: limit,
      orderBy: [
        { patronFirstName: 'asc' },
        { patronLastName: 'asc' }
      ]
    });

    // Format the response to include active loans count and patron type info
    const formattedPatrons = patrons.map(patron => ({
      patronId: patron.patronId,
      name: `${patron.patronFirstName} ${patron.patronLastName}`,
      email: patron.patronEmail,
      type: patron.isStudent ? 'Student' : patron.isFaculty ? 'Faculty' : 'Unknown',
      department: patron.isStudent ? patron.student?.studentDepartment : patron.faculty?.facultyDepartment,
      enrollmentNumber: patron.student?.studentEnrollmentNumber,
      rollNo: patron.student?.studentRollNo,
      semester: patron.student?.studentSemester,
      activeLoanCount: patron.transaction.length,
      activeLoans: patron.transaction.map(t => t.item.title)
    }));

    return NextResponse.json(formattedPatrons);
  } catch (error) {
    console.error('Error searching patrons:', error);
    return NextResponse.json(
      { error: 'Failed to search patrons' },
      { status: 500 }
    );
  }
}
