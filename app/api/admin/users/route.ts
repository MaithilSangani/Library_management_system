import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all users from all tables
    const [admins, librarians, patrons] = await Promise.all([
      prisma.admin.findMany({
        select: {
          adminId: true,
          adminEmail: true,
          adminFirstName: true,
          adminLastName: true,
          adminOriginalPassword: true, // DEV ONLY - showing original passwords
        },
      }),
      prisma.librarian.findMany({
        select: {
          librarianId: true,
          librarianEmail: true,
          librarianFirstName: true,
          librarianLastName: true,
          librarianOriginalPassword: true, // DEV ONLY - showing original passwords
        },
      }),
      prisma.patron.findMany({
        select: {
          patronId: true,
          patronEmail: true,
          patronFirstName: true,
          patronLastName: true,
          patronOriginalPassword: true, // DEV ONLY - showing original passwords
          isStudent: true,
          isFaculty: true,
          patronCreatedAt: true,
        },
      }),
    ]);

    return NextResponse.json(
      {
        admins: admins.map(admin => ({ ...admin, userType: 'ADMIN' })),
        librarians: librarians.map(librarian => ({ ...librarian, userType: 'LIBRARIAN' })),
        patrons: patrons.map(patron => ({ ...patron, userType: 'PATRON' })),
        summary: {
          totalAdmins: admins.length,
          totalLibrarians: librarians.length,
          totalPatrons: patrons.length,
          totalUsers: admins.length + librarians.length + patrons.length,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Database fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
