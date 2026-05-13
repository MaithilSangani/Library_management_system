import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      userType = 'PATRON',
      accountType = 'general', // general, student, faculty
      studentDetails,
      facultyDetails
    } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Additional validation for student/faculty details
    if (accountType === 'student' && userType === 'PATRON') {
      if (!studentDetails || !studentDetails.department) {
        return NextResponse.json(
          { error: 'Student details are required for student accounts' },
          { status: 400 }
        );
      }
    }

    if (accountType === 'faculty' && userType === 'PATRON') {
      if (!facultyDetails || !facultyDetails.department) {
        return NextResponse.json(
          { error: 'Faculty details are required for faculty accounts' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await Promise.all([
      prisma.patron.findUnique({ where: { patronEmail: email } }),
      prisma.admin.findUnique({ where: { adminEmail: email } }),
      prisma.librarian.findUnique({ where: { librarianEmail: email } })
    ]);

    if (existingUser.some(user => user !== null)) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let user;

    // Create user based on type
    switch (userType.toUpperCase()) {
      case 'ADMIN':
        user = await prisma.admin.create({
          data: {
            adminEmail: email,
            adminPassword: hashedPassword,
            adminFirstName: firstName,
            adminLastName: lastName,
            adminOriginalPassword: password, // DEV ONLY - REMOVE IN PRODUCTION
          },
        });
        break;

      case 'LIBRARIAN':
        user = await prisma.librarian.create({
          data: {
            librarianEmail: email,
            librarianPassword: hashedPassword,
            librarianFirstName: firstName,
            librarianLastName: lastName,
            librarianOriginalPassword: password, // DEV ONLY - REMOVE IN PRODUCTION
          },
        });
        break;

      default: // PATRON
        // Create patron with appropriate flags
        user = await prisma.patron.create({
          data: {
            patronEmail: email,
            patronPassword: hashedPassword,
            patronFirstName: firstName,
            patronLastName: lastName,
            patronOriginalPassword: password, // DEV ONLY - REMOVE IN PRODUCTION
            isStudent: accountType === 'student',
            isFaculty: accountType === 'faculty',
          },
        });

        // Create student details if student account
        if (accountType === 'student' && studentDetails) {
          await prisma.student.create({
            data: {
              patronId: user.patronId,
              studentDepartment: studentDetails.department,
              studentSemester: studentDetails.semester || null,
              studentRollNo: studentDetails.rollNo || null,
              studentEnrollmentNumber: studentDetails.enrollmentNumber || null,
            },
          });
        }

        // Create faculty details if faculty account
        if (accountType === 'faculty' && facultyDetails) {
          await prisma.faculty.create({
            data: {
              patronId: user.patronId,
              facultyDepartment: facultyDetails.department,
            },
          });
        }
    }

    // Return success response (exclude password)
    const { ...userWithoutPassword } = user;
    delete (userWithoutPassword as any).adminPassword;
    delete (userWithoutPassword as any).librarianPassword;
    delete (userWithoutPassword as any).patronPassword;

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userWithoutPassword,
        userType: userType.toUpperCase(),
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
