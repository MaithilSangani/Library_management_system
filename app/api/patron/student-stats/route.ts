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

// Helper function to convert BigInt to number safely
function bigIntToNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  try {
    return Number(value);
  } catch {
    return null;
  }
}

// GET /api/patron/student-stats - Get comprehensive student statistics
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      // Fetch patron and verify they are a student
      const patron = await prisma.patron.findUnique({
        where: { patronId: user.patronId },
        include: {
          student: true,
          transaction: {
            include: {
              item: {
                select: {
                  title: true,
                  author: true,
                  itemType: true,
                  subject: true,
                },
              },
            },
            orderBy: {
              borrowedAt: 'desc',
            },
          },
          reservation: {
            include: {
              item: {
                select: {
                  title: true,
                  author: true,
                  subject: true,
                },
              },
            },
          },
        },
      });

      if (!patron) {
        return NextResponse.json(
          { error: 'Patron not found' },
          { status: 404 }
        );
      }

      if (!patron.isStudent) {
        return NextResponse.json(
          { error: 'This endpoint is only available for student patrons' },
          { status: 403 }
        );
      }

      // Calculate current academic year
      const currentDate = new Date();
      const academicYearStart = new Date(currentDate.getFullYear(), 7, 1); // August 1st
      if (currentDate < academicYearStart) {
        academicYearStart.setFullYear(currentDate.getFullYear() - 1);
      }
      const academicYearEnd = new Date(academicYearStart.getFullYear() + 1, 6, 30); // July 30th

      // Calculate statistics
      const currentLoans = patron.transaction.filter(t => !t.isReturned);
      const overdueBooks = currentLoans.filter(t => new Date(t.dueDate) < new Date());
      const totalFines = patron.transaction
        .filter(t => t.finePaid && t.finePaid > 0)
        .reduce((sum, t) => sum + (t.finePaid || 0), 0);

      // Current year transactions
      const currentYearTransactions = patron.transaction.filter(t => 
        new Date(t.borrowedAt) >= academicYearStart && new Date(t.borrowedAt) <= academicYearEnd
      );

      const studentStats = {
        // Personal Information
        studentDetails: {
          patronId: patron.patronId,
          name: `${patron.patronFirstName} ${patron.patronLastName}`,
          email: patron.patronEmail,
          department: patron.student?.studentDepartment || null,
          semester: patron.student?.studentSemester || null,
          rollNo: bigIntToNumber(patron.student?.studentRollNo),
          enrollmentNumber: bigIntToNumber(patron.student?.studentEnrollmentNumber),
          memberSince: patron.patronCreatedAt,
        },

        // Current Status
        currentStatus: {
          activeLoans: currentLoans.length,
          overdueBooks: overdueBooks.length,
          reservations: patron.reservation.length,
          totalFines: totalFines,
          accountStatus: overdueBooks.length > 0 ? 'Overdue' : 
                       currentLoans.length > 0 ? 'Active' : 'Good Standing',
        },

        // Academic Year Statistics
        academicYear: {
          year: `${academicYearStart.getFullYear()}-${academicYearEnd.getFullYear()}`,
          totalBooksRead: currentYearTransactions.length,
          totalBooksAllTime: patron.transaction.length,
        },
      };

      return NextResponse.json(studentStats, { status: 200 });
      
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
