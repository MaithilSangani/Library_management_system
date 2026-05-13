import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 10; // Keep only 10 most recent backups

export async function POST(request: NextRequest) {
  try {
    const { action, backupName, restoreFile } = await request.json();
    
    switch (action) {
      case 'create':
        return await createBackup(backupName);
      
      case 'restore':
        return await restoreBackup(restoreFile);
      
      case 'list':
        return await listBackups();
      
      case 'delete':
        return await deleteBackup(backupName);
      
      case 'info':
        return await getBackupInfo();
      
      case 'verify':
        return await verifyBackup(backupName);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Backup API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function createBackup(customName?: string) {
  try {
    // Ensure backup directory exists
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    }

    // Get database info from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    // Parse database URL to extract connection details
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '3306';
    const database = url.pathname.substring(1); // Remove leading slash
    const username = url.username;
    const password = url.password;

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = customName ? 
      `${customName}_${timestamp}.sql` : 
      `backup_${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Get database statistics before backup
    const stats = await getDatabaseStats();

    // Create mysqldump command
    const dumpCommand = `mysqldump -h ${host} -P ${port} -u ${username} -p${password} ${database} --routines --triggers --single-transaction > "${backupPath}"`;

    // Execute backup
    await execAsync(dumpCommand);

    // Verify backup file was created
    const fileStats = await fs.stat(backupPath);
    
    if (fileStats.size === 0) {
      throw new Error('Backup file is empty');
    }

    // Clean up old backups
    await cleanupOldBackups();

    const backupInfo = {
      filename: backupFileName,
      size: fileStats.size,
      created: new Date().toISOString(),
      tables: stats.tableCount,
      records: stats.totalRecords,
      path: backupPath
    };

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backup: backupInfo
    });

  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to create backup: ${error.message}`
    }, { status: 500 });
  }
}

async function restoreBackup(backupFileName: string) {
  try {
    if (!backupFileName) {
      throw new Error('Backup filename is required');
    }

    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Verify backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      throw new Error('Backup file not found');
    }

    // Get database info from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '3306';
    const database = url.pathname.substring(1);
    const username = url.username;
    const password = url.password;

    // Create restore command
    const restoreCommand = `mysql -h ${host} -P ${port} -u ${username} -p${password} ${database} < "${backupPath}"`;

    // Execute restore (this is potentially dangerous - should have additional safeguards)
    await execAsync(restoreCommand);

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully',
      restoredFrom: backupFileName
    });

  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to restore backup: ${error.message}`
    }, { status: 500 });
  }
}

async function listBackups() {
  try {
    // Ensure backup directory exists
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      return NextResponse.json({
        success: true,
        backups: []
      });
    }

    const files = await fs.readdir(BACKUP_DIR);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));

    const backups = await Promise.all(
      sqlFiles.map(async (filename) => {
        const filePath = path.join(BACKUP_DIR, filename);
        const stats = await fs.stat(filePath);
        
        return {
          filename,
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          sizeFormatted: formatFileSize(stats.size)
        };
      })
    );

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return NextResponse.json({
      success: true,
      backups
    });

  } catch (error) {
    console.error('List backups error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to list backups: ${error.message}`
    }, { status: 500 });
  }
}

async function deleteBackup(backupFileName: string) {
  try {
    if (!backupFileName) {
      throw new Error('Backup filename is required');
    }

    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Verify file exists and is a .sql file
    if (!backupFileName.endsWith('.sql')) {
      throw new Error('Invalid backup file format');
    }

    try {
      await fs.access(backupPath);
    } catch {
      throw new Error('Backup file not found');
    }

    // Delete the backup file
    await fs.unlink(backupPath);

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });

  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to delete backup: ${error.message}`
    }, { status: 500 });
  }
}

async function getBackupInfo() {
  try {
    const stats = await getDatabaseStats();

    // Get backup directory info
    let backupDirSize = 0;
    let backupCount = 0;
    
    try {
      const files = await fs.readdir(BACKUP_DIR);
      const sqlFiles = files.filter(file => file.endsWith('.sql'));
      backupCount = sqlFiles.length;
      
      for (const file of sqlFiles) {
        const filePath = path.join(BACKUP_DIR, file);
        const fileStats = await fs.stat(filePath);
        backupDirSize += fileStats.size;
      }
    } catch {
      // Backup directory doesn't exist yet
    }

    return NextResponse.json({
      success: true,
      info: {
        database: {
          tables: stats.tableCount,
          totalRecords: stats.totalRecords,
          estimatedSize: await getEstimatedDatabaseSize()
        },
        backups: {
          count: backupCount,
          totalSize: backupDirSize,
          totalSizeFormatted: formatFileSize(backupDirSize),
          directory: BACKUP_DIR,
          maxBackups: MAX_BACKUPS
        }
      }
    });

  } catch (error) {
    console.error('Get backup info error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to get backup info: ${error.message}`
    }, { status: 500 });
  }
}

async function verifyBackup(backupFileName: string) {
  try {
    if (!backupFileName) {
      throw new Error('Backup filename is required');
    }

    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch {
      throw new Error('Backup file not found');
    }

    // Get file stats
    const fileStats = await fs.stat(backupPath);
    
    // Read first few lines to verify it's a valid SQL dump
    const fileHandle = await fs.open(backupPath, 'r');
    const buffer = Buffer.alloc(1024);
    await fileHandle.read(buffer, 0, 1024, 0);
    await fileHandle.close();
    
    const header = buffer.toString('utf8');
    const isValidSqlDump = header.includes('mysqldump') || header.includes('CREATE TABLE') || header.includes('INSERT INTO');

    return NextResponse.json({
      success: true,
      verification: {
        filename: backupFileName,
        size: fileStats.size,
        sizeFormatted: formatFileSize(fileStats.size),
        created: fileStats.birthtime.toISOString(),
        isValid: isValidSqlDump,
        readable: true
      }
    });

  } catch (error) {
    console.error('Verify backup error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to verify backup: ${error.message}`
    }, { status: 500 });
  }
}

async function getDatabaseStats() {
  try {
    const [
      adminCount,
      librarianCount,
      patronCount,
      itemCount,
      transactionCount,
      paymentCount,
      borrowRequestCount,
      reservationCount
    ] = await Promise.all([
      prisma.admin.count(),
      prisma.librarian.count(),
      prisma.patron.count(),
      prisma.item.count(),
      prisma.transaction.count(),
      prisma.payment.count(),
      prisma.borrowrequest.count(),
      prisma.reservation.count()
    ]);

    const totalRecords = adminCount + librarianCount + patronCount + itemCount + 
                        transactionCount + paymentCount + borrowRequestCount + reservationCount;

    return {
      tableCount: 8, // Number of main tables
      totalRecords,
      breakdown: {
        admin: adminCount,
        librarian: librarianCount,
        patron: patronCount,
        item: itemCount,
        transaction: transactionCount,
        payment: paymentCount,
        borrowrequest: borrowRequestCount,
        reservation: reservationCount
      }
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      tableCount: 0,
      totalRecords: 0,
      breakdown: {}
    };
  }
}

async function getEstimatedDatabaseSize(): Promise<string> {
  try {
    // This is a rough estimation based on record counts
    const stats = await getDatabaseStats();
    const estimatedSizeBytes = stats.totalRecords * 500; // Rough estimate of 500 bytes per record
    return formatFileSize(estimatedSizeBytes);
  } catch {
    return 'Unknown';
  }
}

async function cleanupOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    if (sqlFiles.length <= MAX_BACKUPS) {
      return; // No cleanup needed
    }

    // Get file stats with timestamps
    const filesWithStats = await Promise.all(
      sqlFiles.map(async (filename) => {
        const filePath = path.join(BACKUP_DIR, filename);
        const stats = await fs.stat(filePath);
        return { filename, created: stats.birthtime, path: filePath };
      })
    );

    // Sort by creation date (oldest first)
    filesWithStats.sort((a, b) => a.created.getTime() - b.created.getTime());

    // Delete oldest files
    const filesToDelete = filesWithStats.slice(0, filesWithStats.length - MAX_BACKUPS);
    
    for (const file of filesToDelete) {
      await fs.unlink(file.path);
    }

  } catch (error) {
    console.error('Cleanup error:', error);
    // Non-critical error, don't throw
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
