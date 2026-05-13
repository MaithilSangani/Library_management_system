import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch library settings - there should only be one record with id = 1
    const settings = await prisma.librarysettings.findFirst({
      include: {
        admin: {
          select: {
            adminId: true,
            adminFirstName: true,
            adminLastName: true,
            adminEmail: true
          }
        }
      }
    });

    if (!settings) {
      // If no settings exist, return default values
      return NextResponse.json({
        success: true,
        settings: {
          librarySettingsId: 1,
          borrowingLimit: 5,
          loanPeriodDays: 14,
          finePerDay: 1.0,
          updatedAt: new Date().toISOString(),
          updatedByAdminId: null,
          updatedBy: null
        }
      });
    }

    // Format the response
    const formattedSettings = {
      librarySettingsId: settings.librarySettingsId,
      borrowingLimit: settings.borrowingLimit,
      loanPeriodDays: settings.loanPeriodDays,
      finePerDay: settings.finePerDay,
      updatedAt: settings.updatedAt.toISOString(),
      updatedByAdminId: settings.updatedByAdminId,
      updatedBy: settings.admin ? {
        id: settings.admin.adminId,
        name: `${settings.admin.adminFirstName} ${settings.admin.adminLastName}`,
        email: settings.admin.adminEmail
      } : null
    };

    return NextResponse.json({
      success: true,
      settings: formattedSettings
    });
  } catch (error) {
    console.error('Error fetching library settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch library settings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { borrowingLimit, loanPeriodDays, finePerDay, updatedByAdminId } = body;

    // Validate required fields
    if (borrowingLimit === undefined || loanPeriodDays === undefined || finePerDay === undefined) {
      return NextResponse.json(
        { success: false, error: 'All configuration fields are required' },
        { status: 400 }
      );
    }

    // Validate data types and ranges
    if (!Number.isInteger(borrowingLimit) || borrowingLimit < 1 || borrowingLimit > 50) {
      return NextResponse.json(
        { success: false, error: 'Borrowing limit must be an integer between 1 and 50' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(loanPeriodDays) || loanPeriodDays < 1 || loanPeriodDays > 365) {
      return NextResponse.json(
        { success: false, error: 'Loan period must be an integer between 1 and 365 days' },
        { status: 400 }
      );
    }

    if (typeof finePerDay !== 'number' || finePerDay < 0 || finePerDay > 1000) {
      return NextResponse.json(
        { success: false, error: 'Fine per day must be a number between 0 and 1000' },
        { status: 400 }
      );
    }

    // Validate admin ID if provided
    if (updatedByAdminId) {
      const adminExists = await prisma.admin.findUnique({
        where: { adminId: updatedByAdminId }
      });
      if (!adminExists) {
        return NextResponse.json(
          { success: false, error: 'Invalid admin ID' },
          { status: 400 }
        );
      }
    }

    // Update or create library settings
    const updatedSettings = await prisma.librarysettings.upsert({
      where: { librarySettingsId: 1 },
      update: {
        borrowingLimit,
        loanPeriodDays,
        finePerDay,
        updatedByAdminId: updatedByAdminId || null,
      },
      create: {
        librarySettingsId: 1,
        borrowingLimit,
        loanPeriodDays,
        finePerDay,
        updatedByAdminId: updatedByAdminId || null,
      },
      include: {
        admin: {
          select: {
            adminId: true,
            adminFirstName: true,
            adminLastName: true,
            adminEmail: true
          }
        }
      }
    });

    const formattedSettings = {
      librarySettingsId: updatedSettings.librarySettingsId,
      borrowingLimit: updatedSettings.borrowingLimit,
      loanPeriodDays: updatedSettings.loanPeriodDays,
      finePerDay: updatedSettings.finePerDay,
      updatedAt: updatedSettings.updatedAt.toISOString(),
      updatedByAdminId: updatedSettings.updatedByAdminId,
      updatedBy: updatedSettings.admin ? {
        id: updatedSettings.admin.adminId,
        name: `${updatedSettings.admin.adminFirstName} ${updatedSettings.admin.adminLastName}`,
        email: updatedSettings.admin.adminEmail
      } : null
    };

    return NextResponse.json({
      success: true,
      message: 'Library settings updated successfully',
      settings: formattedSettings
    });
  } catch (error) {
    console.error('Error updating library settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update library settings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to fetch system statistics for the configuration dashboard
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'getSystemStats') {
      // Fetch various system statistics
      const [
        totalUsers,
        totalItems,
        totalTransactions,
        overdueTransactions,
        pendingRequests,
        totalFinesCollected
      ] = await Promise.all([
        // Total users across all tables
        Promise.all([
          prisma.admin.count(),
          prisma.librarian.count(),
          prisma.patron.count()
        ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
        
        // Total items in library
        prisma.item.count(),
        
        // Total transactions
        prisma.transaction.count(),
        
        // Overdue transactions
        prisma.transaction.count({
          where: {
            isReturned: false,
            dueDate: {
              lt: new Date()
            }
          }
        }),
        
        // Pending borrow requests
        prisma.borrowrequest.count({
          where: {
            status: 'PENDING'
          }
        }),
        
        // Total fines collected
        prisma.payment.aggregate({
          where: {
            paymentType: 'FINE',
            paymentStatus: 'PAID'
          },
          _sum: {
            amount: true
          }
        }).then(result => result._sum.amount || 0)
      ]);

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers,
          totalItems,
          totalTransactions,
          overdueTransactions,
          pendingRequests,
          totalFinesCollected: Number(totalFinesCollected.toFixed(2))
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
