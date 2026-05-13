import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all users from different tables
    const [admins, librarians, patrons] = await Promise.all([
      prisma.admin.findMany({
        select: {
          adminId: true,
          adminEmail: true,
          adminFirstName: true,
          adminLastName: true,
        }
      }),
      prisma.librarian.findMany({
        select: {
          librarianId: true,
          librarianEmail: true,
          librarianFirstName: true,
          librarianLastName: true,
        }
      }),
      prisma.patron.findMany({
        select: {
          patronId: true,
          patronEmail: true,
          patronFirstName: true,
          patronLastName: true,
          isStudent: true,
          isFaculty: true,
          patronCreatedAt: true,
        }
      })
    ]);

    // Format users into a consistent structure for the UI
    const formattedUsers = [
      ...admins.map(admin => ({
        id: `admin_${admin.adminId}`,
        name: `${admin.adminFirstName} ${admin.adminLastName}`,
        email: admin.adminEmail,
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString().split('T')[0], // Default since admin table doesn't have createdAt
        originalId: admin.adminId
      })),
      ...librarians.map(librarian => ({
        id: `librarian_${librarian.librarianId}`,
        name: `${librarian.librarianFirstName} ${librarian.librarianLastName}`,
        email: librarian.librarianEmail,
        role: 'LIBRARIAN' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString().split('T')[0], // Default since librarian table doesn't have createdAt
        originalId: librarian.librarianId
      })),
      ...patrons.map(patron => ({
        id: `patron_${patron.patronId}`,
        name: `${patron.patronFirstName} ${patron.patronLastName}`,
        email: patron.patronEmail,
        role: 'PATRON' as const,
        status: 'ACTIVE' as const,
        createdAt: patron.patronCreatedAt.toISOString().split('T')[0],
        originalId: patron.patronId,
        isStudent: patron.isStudent,
        isFaculty: patron.isFaculty
      }))
    ];

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      summary: {
        totalAdmins: admins.length,
        totalLibrarians: librarians.length,
        totalPatrons: patrons.length,
        totalUsers: admins.length + librarians.length + patrons.length,
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, password } = body;

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;

    // Create user in appropriate table based on role
    switch (role) {
      case 'ADMIN':
        // Check if admin email already exists
        const existingAdmin = await prisma.admin.findUnique({
          where: { adminEmail: email }
        });
        if (existingAdmin) {
          return NextResponse.json(
            { success: false, error: 'Email already exists' },
            { status: 409 }
          );
        }

        newUser = await prisma.admin.create({
          data: {
            adminEmail: email,
            adminFirstName: firstName,
            adminLastName: lastName,
            adminPassword: hashedPassword,
            adminOriginalPassword: password
          }
        });
        break;

      case 'LIBRARIAN':
        // Check if librarian email already exists
        const existingLibrarian = await prisma.librarian.findUnique({
          where: { librarianEmail: email }
        });
        if (existingLibrarian) {
          return NextResponse.json(
            { success: false, error: 'Email already exists' },
            { status: 409 }
          );
        }

        newUser = await prisma.librarian.create({
          data: {
            librarianEmail: email,
            librarianFirstName: firstName,
            librarianLastName: lastName,
            librarianPassword: hashedPassword,
            librarianOriginalPassword: password
          }
        });
        break;

      case 'PATRON':
        // Check if patron email already exists
        const existingPatron = await prisma.patron.findUnique({
          where: { patronEmail: email }
        });
        if (existingPatron) {
          return NextResponse.json(
            { success: false, error: 'Email already exists' },
            { status: 409 }
          );
        }

        newUser = await prisma.patron.create({
          data: {
            patronEmail: email,
            patronFirstName: firstName,
            patronLastName: lastName,
            patronPassword: hashedPassword,
            patronOriginalPassword: password,
            isStudent: false,
            isFaculty: false
          }
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid role specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: `${role.toLowerCase()}_${newUser[`${role.toLowerCase()}Id`]}`,
        name,
        email,
        role,
        status: 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, role } = body;

    if (!id || !name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Parse user ID to get table and original ID
    const [tableType, originalId] = id.split('_');
    const numericId = parseInt(originalId);

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    let updatedUser;

    // Update user in appropriate table
    switch (tableType) {
      case 'admin':
        updatedUser = await prisma.admin.update({
          where: { adminId: numericId },
          data: {
            adminEmail: email,
            adminFirstName: firstName,
            adminLastName: lastName
          }
        });
        break;

      case 'librarian':
        updatedUser = await prisma.librarian.update({
          where: { librarianId: numericId },
          data: {
            librarianEmail: email,
            librarianFirstName: firstName,
            librarianLastName: lastName
          }
        });
        break;

      case 'patron':
        updatedUser = await prisma.patron.update({
          where: { patronId: numericId },
          data: {
            patronEmail: email,
            patronFirstName: firstName,
            patronLastName: lastName
          }
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid user ID' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id,
        name,
        email,
        role,
        status: 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Parse user ID to get table and original ID
    const [tableType, originalId] = id.split('_');
    const numericId = parseInt(originalId);

    // Delete user from appropriate table
    switch (tableType) {
      case 'admin':
        await prisma.admin.delete({
          where: { adminId: numericId }
        });
        break;

      case 'librarian':
        await prisma.librarian.delete({
          where: { librarianId: numericId }
        });
        break;

      case 'patron':
        // Note: Deleting a patron might have cascade effects due to foreign key constraints
        // You might want to handle this differently in production
        await prisma.patron.delete({
          where: { patronId: numericId }
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid user ID' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user. User may have associated records.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
