import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to get user from token
function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : 
                request.cookies.get('auth-token')?.value || 
                request.headers.get('x-auth-token');

  if (!token) {
    return null;
  }

  try {
    // Verify and decode JWT token using the secret
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Extract user information based on userType
    if (decoded.userType === 'PATRON') {
      return {
        patronId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType
      };
    } else {
      // Not a patron, return null
      return null;
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET /api/patron/profile - Get patron's full profile with statistics
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
      // Fetch patron's complete profile data
      const patron = await prisma.patron.findUnique({
        where: { patronId: user.patronId },
        include: {
          student: true,
          faculty: true,
          transaction: {
            include: {
              item: {
                select: {
                  title: true,
                  author: true,
                  itemType: true,
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
                  itemType: true,
                },
              },
            },
            orderBy: {
              reservedAt: 'desc',
            },
          },
          _count: {
            select: {
              transaction: true,
              reservation: true,
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


      // Calculate statistics
      const currentLoans = patron.transaction.filter(t => !t.isReturned);
      const overdueBooks = currentLoans.filter(t => new Date(t.dueDate) < new Date());
      const totalFines = patron.transaction
        .filter(t => t.finePaid)
        .reduce((sum, t) => sum + (t.finePaid || 0), 0);
      
      const recentTransactions = patron.transaction.slice(0, 10).map((t) => ({
        transactionId: t.transactionId,
        borrowedAt: t.borrowedAt,
        returnedAt: t.returnedAt,
        dueDate: t.dueDate,
        isReturned: t.isReturned,
        finePaid: t.finePaid,
        isOverdue: !t.isReturned && new Date(t.dueDate) < new Date(),
        item: {
          title: t.item.title,
          author: t.item.author,
          itemType: t.item.itemType,
        },
      }));

      const formattedProfile = {
        // Personal Information
        patronId: patron.patronId,
        patronEmail: patron.patronEmail,
        patronFirstName: patron.patronFirstName,
        patronLastName: patron.patronLastName,
        fullName: `${patron.patronFirstName} ${patron.patronLastName}`,
        isStudent: patron.isStudent,
        isFaculty: patron.isFaculty,
        patronCreatedAt: patron.patronCreatedAt,
        patronUpdatedAt: patron.patronUpdatedAt,
        
        // User Type and Status
        userType: patron.isStudent ? 'Student' : patron.isFaculty ? 'Faculty' : 'General Patron',
        status: overdueBooks.length > 0 ? 'Overdue' : currentLoans.length > 0 ? 'Active' : 'Good Standing',
        
        // Statistics
        stats: {
          totalBorrowed: patron._count.transaction,
          currentLoans: currentLoans.length,
          overdueBooks: overdueBooks.length,
          totalFines: totalFines,
          reservations: patron.reservation.length,
          memberSince: patron.patronCreatedAt,
        },
        
        // Transaction History
        recentTransactions,
        
        // Reservations
        reservations: patron.reservation.map((r) => ({
          reservationId: r.reservationId,
          reservedAt: r.reservedAt,
          item: {
            title: r.item.title,
            author: r.item.author,
            itemType: r.item.itemType,
          },
        })),
        
        // Additional Details
        studentDetails: patron.student ? {
          department: patron.student.studentDepartment,
          semester: patron.student.studentSemester,
          rollNo: patron.student.studentRollNo ? Number(patron.student.studentRollNo) : null,
          enrollmentNumber: patron.student.studentEnrollmentNumber ? Number(patron.student.studentEnrollmentNumber) : null,
        } : null,
        
        facultyDetails: patron.faculty ? {
          department: patron.faculty.facultyDepartment,
        } : null,
      };

      return NextResponse.json(formattedProfile, { status: 200 });
      
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching patron profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

// PUT /api/patron/profile - Update patron profile including student and faculty details
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { patronFirstName, patronLastName, patronEmail, studentDetails, facultyDetails } = body;

    // Validate required fields
    if (!patronFirstName?.trim() || !patronLastName?.trim() || !patronEmail?.trim()) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patronEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    try {
      // Check if patron exists
      const existingPatron = await prisma.patron.findUnique({
        where: { patronId: user.patronId },
        include: {
          student: true,
        },
      });

      if (!existingPatron) {
        return NextResponse.json(
          { error: 'Patron not found' },
          { status: 404 }
        );
      }

      // Check if email is already taken by another patron
      if (patronEmail !== existingPatron.patronEmail) {
        const emailExists = await prisma.patron.findUnique({
          where: { patronEmail },
        });

        if (emailExists) {
          return NextResponse.json(
            { error: 'Email is already taken by another patron' },
            { status: 400 }
          );
        }
      }

      // Update patron basic info
      const updatedPatron = await prisma.patron.update({
        where: { patronId: user.patronId },
        data: {
          patronFirstName,
          patronLastName,
          patronEmail,
        },
      });

      // Update student details if patron is a student and studentDetails provided
      if (existingPatron.isStudent && studentDetails) {
        console.log('Updating student details:', studentDetails);
        
        const studentData = {
          studentDepartment: studentDetails.department?.trim() || null,
          studentSemester: studentDetails.semester ? Number(studentDetails.semester) : null,
          studentRollNo: studentDetails.rollNo ? Number(studentDetails.rollNo) : null,
          studentEnrollmentNumber: studentDetails.enrollmentNumber ? Number(studentDetails.enrollmentNumber) : null,
        };
        
        console.log('Processed student data:', studentData);

        // Check if enrollment number is being changed and if it's unique
        if (studentData.studentEnrollmentNumber && existingPatron.student) {
          const existingEnrollmentNumber = existingPatron.student.studentEnrollmentNumber;
          
          // Only check for duplicates if the enrollment number is actually changing
          if (Number(existingEnrollmentNumber) !== studentData.studentEnrollmentNumber) {
            const existingStudent = await prisma.student.findFirst({
              where: {
                studentEnrollmentNumber: studentData.studentEnrollmentNumber,
                patronId: { not: user.patronId } // Exclude current patron
              }
            });
            
            if (existingStudent) {
              return NextResponse.json(
                { error: `Enrollment number ${studentData.studentEnrollmentNumber} is already taken by another student` },
                { status: 400 }
              );
            }
          }
        }

        if (existingPatron.student) {
          // Update existing student record
          try {
            const updatedStudent = await prisma.student.update({
              where: { patronId: user.patronId },
              data: studentData,
            });
            console.log('Updated student record:', updatedStudent.studentId);
          } catch (updateError: any) {
            console.error('Student update error:', updateError);
            if (updateError.code === 'P2002') {
              return NextResponse.json(
                { error: 'Enrollment number is already taken by another student' },
                { status: 400 }
              );
            }
            throw updateError;
          }
        } else {
          // Create new student record
          try {
            const newStudent = await prisma.student.create({
              data: {
                patronId: user.patronId,
                ...studentData,
              },
            });
            console.log('Created new student record:', newStudent.studentId);
          } catch (createError: any) {
            console.error('Student create error:', createError);
            if (createError.code === 'P2002') {
              return NextResponse.json(
                { error: 'Enrollment number is already taken by another student' },
                { status: 400 }
              );
            }
            throw createError;
          }
        }
      }

      console.log('Profile updated successfully for patron:', updatedPatron.patronId);
      
      return NextResponse.json({
        message: 'Profile updated successfully',
        patron: {
          patronId: updatedPatron.patronId,
          patronEmail: updatedPatron.patronEmail,
          patronFirstName: updatedPatron.patronFirstName,
          patronLastName: updatedPatron.patronLastName,
          fullName: `${updatedPatron.patronFirstName} ${updatedPatron.patronLastName}`,
        },
      });

    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating patron profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
