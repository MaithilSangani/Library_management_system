import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - List all patrons with search and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // all, student, faculty, general
    const status = searchParams.get('status') || 'all'; // all, active, suspended
    
    const skip = (page - 1) * limit;

    // Build where clause for filtering (using actual schema fields)
    const where: any = {};
    
    if (search) {
      where.OR = [
        { patronFirstName: { contains: search, mode: 'insensitive' } },
        { patronLastName: { contains: search, mode: 'insensitive' } },
        { patronEmail: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type !== 'all') {
      switch (type) {
        case 'student':
          where.isStudent = true;
          break;
        case 'faculty':
          where.isFaculty = true;
          break;
        case 'general':
          where.isStudent = false;
          where.isFaculty = false;
          break;
      }
    }

    // Note: There is no isSuspended in schema; ignoring 'status' filter for now

    // Get patrons with related data
    const [patrons, totalCount] = await Promise.all([
      prisma.patron.findMany({
        where,
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
        },
        orderBy: { patronCreatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.patron.count({ where })
    ]);

    // Transform data to include calculated fields
    const patronsWithStats = patrons.map(p => ({
      id: p.patronId,
      firstName: p.patronFirstName,
      lastName: p.patronLastName,
      email: p.patronEmail,
      // Student/Faculty specific fields
      studentEnrollmentNumber: p.student?.studentEnrollmentNumber ? String(p.student.studentEnrollmentNumber) : undefined,
      studentDepartment: p.student?.studentDepartment || undefined,
      facultyDepartment: p.faculty?.facultyDepartment || undefined,
      isStudent: p.isStudent,
      isFaculty: p.isFaculty,
      isSuspended: false,
      createdAt: p.patronCreatedAt.toISOString(),
      updatedAt: p.patronUpdatedAt.toISOString(),
      // Calculated stats
      activeTransactions: p.transaction.filter(t => !t.isReturned).length,
      totalTransactions: p.transaction.length,
      overdueTransactions: p.transaction.filter(t => 
        !t.isReturned && new Date(t.dueDate) < new Date()
      ).length,
      activeReservations: p.reservation.length, // reservation has no status field in schema
      totalReservations: p.reservation.length
    }));

    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      success: true,
      data: {
        patrons: patronsWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching patrons:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch patrons',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new patron
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      isStudent,
      isFaculty,
      // Student fields
      studentDepartment,
      studentSemester,
      studentRollNo,
      studentEnrollmentNumber,
      // Faculty fields
      facultyDepartment
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingPatron = await prisma.patron.findUnique({
      where: { patronEmail: email }
    });

    if (existingPatron) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Note: schema has no studentId/employeeId on patron; skipping these checks

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new patron
    const newPatron = await prisma.patron.create({
      data: {
        patronFirstName: firstName,
        patronLastName: lastName,
        patronEmail: email,
        patronPassword: hashedPassword,
        isStudent: isStudent || false,
        isFaculty: isFaculty || false
      },
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

    // Create student record if needed
    if (isStudent && newPatron.patronId) {
      await prisma.student.create({
        data: {
          patronId: newPatron.patronId,
          studentDepartment: studentDepartment || null,
          studentSemester: studentSemester ? parseInt(studentSemester) : null,
          studentRollNo: studentRollNo ? parseInt(studentRollNo) : null,
          studentEnrollmentNumber: studentEnrollmentNumber ? parseInt(studentEnrollmentNumber) : null
        }
      }).catch(error => {
        console.warn('Failed to create student record:', error);
      });
    }

    // Create faculty record if needed
    if (isFaculty && newPatron.patronId) {
      await prisma.faculty.create({
        data: {
          patronId: newPatron.patronId,
          facultyDepartment: facultyDepartment || null
        }
      }).catch(error => {
        console.warn('Failed to create faculty record:', error);
      });
    }

    // Fetch updated patron with related data for response
    const updatedPatronData = await prisma.patron.findUnique({
      where: { patronId: newPatron.patronId },
      include: {
        student: true,
        faculty: true,
        transaction: true,
        reservation: true
      }
    });

    // Transform response to match the expected format
    const patronWithStats = {
      id: updatedPatronData!.patronId,
      firstName: updatedPatronData!.patronFirstName,
      lastName: updatedPatronData!.patronLastName,
      email: updatedPatronData!.patronEmail,
      studentEnrollmentNumber: updatedPatronData!.student?.studentEnrollmentNumber ? String(updatedPatronData!.student.studentEnrollmentNumber) : undefined,
      studentDepartment: updatedPatronData!.student?.studentDepartment || undefined,
      facultyDepartment: updatedPatronData!.faculty?.facultyDepartment || undefined,
      isStudent: updatedPatronData!.isStudent,
      isFaculty: updatedPatronData!.isFaculty,
      isSuspended: false,
      createdAt: updatedPatronData!.patronCreatedAt.toISOString(),
      updatedAt: updatedPatronData!.patronUpdatedAt.toISOString(),
      activeTransactions: 0,
      totalTransactions: 0,
      overdueTransactions: 0,
      activeReservations: 0,
      totalReservations: 0
    };

    return NextResponse.json({
      success: true,
      data: patronWithStats,
      message: 'Patron created successfully'
    });

  } catch (error) {
    console.error('Error creating patron:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create patron',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
