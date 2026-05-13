import { NextRequest, NextResponse } from 'next/server';

// Mock backup data
const mockBackups = [
  {
    id: '1',
    filename: 'library_backup_2024-01-15.sql',
    size: 15728640, // 15MB
    type: 'AUTO',
    status: 'COMPLETED',
    createdAt: '2024-01-15T02:00:00Z',
    description: 'Automated daily backup'
  },
  {
    id: '2',
    filename: 'library_backup_2024-01-14.sql',
    size: 14892032, // 14.2MB
    type: 'AUTO',
    status: 'COMPLETED',
    createdAt: '2024-01-14T02:00:00Z',
    description: 'Automated daily backup'
  },
  {
    id: '3',
    filename: 'library_manual_backup_2024-01-13.sql',
    size: 16777216, // 16MB
    type: 'MANUAL',
    status: 'COMPLETED',
    createdAt: '2024-01-13T14:30:00Z',
    description: 'Manual backup before system update'
  },
  {
    id: '4',
    filename: 'library_backup_2024-01-12.sql',
    size: 0,
    type: 'AUTO',
    status: 'FAILED',
    createdAt: '2024-01-12T02:00:00Z',
    description: 'Failed automated backup - disk space issue'
  }
];

// GET: Fetch backup files
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      backups: mockBackups
    });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}

// DELETE: Remove backup files
export async function DELETE(request: NextRequest) {
  try {
    const { backupIds } = await request.json();

    if (!backupIds || !Array.isArray(backupIds) || backupIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Backup IDs are required' },
        { status: 400 }
      );
    }

    // Calculate space that would be freed
    const backupsToDelete = mockBackups.filter(backup => backupIds.includes(backup.id));
    const spaceFreed = backupsToDelete.reduce((total, backup) => total + backup.size, 0);
    
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return NextResponse.json({
      success: true,
      message: `${backupIds.length} backup(s) deleted successfully`,
      deletedCount: backupIds.length,
      spaceFreed: formatBytes(spaceFreed)
    });

  } catch (error) {
    console.error('Error deleting backups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete backups' },
      { status: 500 }
    );
  }
}
