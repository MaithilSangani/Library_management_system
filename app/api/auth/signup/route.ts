import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, userType = 'PATRON' } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
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
        user = await prisma.patron.create({
          data: {
            patronEmail: email,
            patronPassword: hashedPassword,
            patronFirstName: firstName,
            patronLastName: lastName,
            patronOriginalPassword: password, // DEV ONLY - REMOVE IN PRODUCTION
          },
        });
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
