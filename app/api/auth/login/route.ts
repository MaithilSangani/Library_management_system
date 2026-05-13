import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check in all user tables
    const [patron, admin, librarian] = await Promise.all([
      prisma.patron.findUnique({ where: { patronEmail: email } }),
      prisma.admin.findUnique({ where: { adminEmail: email } }),
      prisma.librarian.findUnique({ where: { librarianEmail: email } })
    ]);

    let user = null;
    let userType = '';
    let hashedPassword = '';

    if (patron) {
      user = patron;
      userType = 'PATRON';
      hashedPassword = patron.patronPassword;
    } else if (admin) {
      user = admin;
      userType = 'ADMIN';
      hashedPassword = admin.adminPassword;
    } else if (librarian) {
      user = librarian;
      userType = 'LIBRARIAN';
      hashedPassword = librarian.librarianPassword;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    let userId: number;
    if (userType === 'PATRON') {
      userId = (user as any).patronId;
    } else if (userType === 'ADMIN') {
      userId = (user as any).adminId;
    } else {
      userId = (user as any).librarianId;
    }
    
    const token = jwt.sign(
      {
        userId: userId,
        email: email,
        userType: userType,
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Determine dashboard route based on user type
    let dashboardRoute = '/dashboard';
    if (userType === 'ADMIN') {
      dashboardRoute = '/dashboard/admin';
    } else if (userType === 'LIBRARIAN') {
      dashboardRoute = '/dashboard/librarian';
    } else if (userType === 'PATRON') {
      dashboardRoute = '/dashboard/patron';
    }

    // Remove password from response
    const { ...userWithoutPassword } = user;
    delete (userWithoutPassword as any).adminPassword;
    delete (userWithoutPassword as any).librarianPassword;
    delete (userWithoutPassword as any).patronPassword;

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userWithoutPassword,
        userType: userType,
        token: token,
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
