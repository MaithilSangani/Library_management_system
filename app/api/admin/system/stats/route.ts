import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// GET: Fetch system statistics
export async function GET(request: NextRequest) {
  try {
    // Get system logs stats
    const [logStats, notificationStats] = await Promise.all([
      prisma.systemLog.groupBy({
        by: ['level'],
        _count: { level: true }
      }),
      prisma.notification.aggregate({
        _count: { notificationId: true },
        where: { isRead: false }
      })
    ]);

    // Calculate log statistics
    const logs = {
      total: logStats.reduce((sum, stat) => sum + stat._count.level, 0),
      errors: logStats.find(stat => stat.level === 'ERROR')?._count.level || 0,
      warnings: logStats.find(stat => stat.level === 'WARN')?._count.level || 0
    };

    // Get last error
    const lastError = await prisma.systemLog.findFirst({
      where: { level: 'ERROR' },
      orderBy: { timestamp: 'desc' },
      select: { message: true, timestamp: true }
    });

    // Get notification statistics
    const totalNotifications = await prisma.notification.count();
    const unreadNotifications = notificationStats._count.notificationId;

    const notifications = {
      total: totalNotifications,
      unread: unreadNotifications,
      oldestUnread: null // You can implement this if needed
    };

    // Mock backup statistics (you can implement real backup tracking)
    const backups = {
      total: 0,
      failed: 0,
      totalSize: 0,
      lastBackup: null
    };

    // Mock report statistics
    const reports = {
      total: 0,
      expired: 0,
      totalSize: 0
    };

    // Calculate storage usage (simplified)
    let storage = {
      used: 0,
      available: 1000000000, // 1GB mock
      percentage: 0
    };

    try {
      // Try to get actual disk usage if possible
      const storageDir = path.join(process.cwd(), 'storage');
      try {
        const files = await fs.readdir(storageDir, { withFileTypes: true });
        let totalSize = 0;
        
        for (const file of files) {
          if (file.isFile()) {
            const filePath = path.join(storageDir, file.name);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
          }
        }
        
        storage.used = totalSize;
        storage.percentage = Math.round((totalSize / storage.available) * 100);
      } catch (storageError) {
        // Storage directory might not exist
        storage.percentage = 5; // Default to 5%
      }
    } catch (error) {
      console.error('Error calculating storage:', error);
    }

    const systemStats = {
      logs: {
        ...logs,
        lastError: lastError?.message
      },
      notifications,
      backups,
      reports,
      storage
    };

    return NextResponse.json(systemStats);

  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
