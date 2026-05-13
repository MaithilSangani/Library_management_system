import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get total users count
    const totalUsers = await prisma.patron.count();
    
    // Get users by type
    const [students, faculty, admins, librarians] = await Promise.all([
      prisma.patron.count({ where: { isStudent: true } }),
      prisma.patron.count({ where: { isFaculty: true } }),
      prisma.admin.count(),
      prisma.librarian.count()
    ]);

    // Get recent registrations (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await prisma.patron.count({
      where: {
        patronCreatedAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Get active users (users who have made transactions in the last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await prisma.patron.count({
      where: {
        transaction: {
          some: {
            borrowedAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });

    const response = {
      totalUsers: totalUsers + admins + librarians, // Include all user types
      totalPatrons: totalUsers,
      breakdown: {
        students,
        faculty,
        admins,
        librarians
      },
      recentRegistrations,
      activeUsers,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user count statistics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user statistics',
        totalUsers: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
