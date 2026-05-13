import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// POST: Archive old system logs
export async function POST(request: NextRequest) {
  try {
    const { olderThanDays = 30 } = await request.json();

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get logs to be archived
    const logsToArchive = await prisma.systemLog.findMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (logsToArchive.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No logs found to archive',
        archivedCount: 0
      });
    }

    // Create archive directory if it doesn't exist
    const archiveDir = path.join(process.cwd(), 'storage', 'archives', 'logs');
    try {
      await fs.mkdir(archiveDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Create archive file with timestamp
    const archiveFileName = `system_logs_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    const archiveFilePath = path.join(archiveDir, archiveFileName);

    // Prepare archive data
    const archiveData = {
      archivedAt: new Date().toISOString(),
      olderThanDays,
      cutoffDate: cutoffDate.toISOString(),
      totalLogs: logsToArchive.length,
      logs: logsToArchive.map(log => ({
        id: log.id,
        level: log.level,
        message: log.message,
        timestamp: log.timestamp.toISOString(),
        source: log.source,
        userId: log.userId,
        ip: log.ip
      }))
    };

    // Write archive file
    await fs.writeFile(archiveFilePath, JSON.stringify(archiveData, null, 2));

    // Delete archived logs from database in transaction
    const result = await prisma.$transaction(async (tx) => {
      const deleteResult = await tx.systemLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      // Create audit log entry
      await tx.systemLog.create({
        data: {
          level: 'INFO',
          message: `System archived ${deleteResult.count} log entries older than ${olderThanDays} days to ${archiveFileName}`,
          source: 'SYSTEM_ARCHIVE',
          timestamp: new Date()
        }
      });

      return deleteResult;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${result.count} log entries`,
      archivedCount: result.count,
      archiveFile: archiveFileName,
      cutoffDate: cutoffDate.toISOString()
    });

  } catch (error) {
    console.error('Error archiving system logs:', error);
    
    // Log the error
    try {
      await prisma.systemLog.create({
        data: {
          level: 'ERROR',
          message: `Failed to archive system logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
          source: 'SYSTEM_ARCHIVE',
          timestamp: new Date()
        }
      });
    } catch (logError) {
      console.error('Failed to log archive error:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'Failed to archive system logs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
