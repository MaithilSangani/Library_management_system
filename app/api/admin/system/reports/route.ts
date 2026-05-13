import { NextRequest, NextResponse } from 'next/server';

// Mock reports data
const mockReports = [
  {
    id: '1',
    name: 'Monthly Library Usage Report - December 2024',
    type: 'USAGE',
    generatedBy: 'Admin User',
    createdAt: '2024-01-02T10:30:00Z',
    size: 2097152, // 2MB
    downloadCount: 5,
    status: 'READY'
  },
  {
    id: '2',
    name: 'User Activity Summary - Q4 2024',
    type: 'ACTIVITY',
    generatedBy: 'System',
    createdAt: '2024-01-01T06:00:00Z',
    size: 1572864, // 1.5MB
    downloadCount: 12,
    status: 'READY'
  },
  {
    id: '3',
    name: 'Financial Report - December 2024',
    type: 'FINANCIAL',
    generatedBy: 'Admin User',
    createdAt: '2023-12-31T23:45:00Z',
    size: 786432, // 768KB
    downloadCount: 3,
    status: 'EXPIRED'
  },
  {
    id: '4',
    name: 'System Performance Report - In Progress',
    type: 'SYSTEM',
    generatedBy: 'System',
    createdAt: '2024-01-15T14:20:00Z',
    size: 0,
    downloadCount: 0,
    status: 'GENERATING'
  },
  {
    id: '5',
    name: 'Book Inventory Analysis - November 2024',
    type: 'INVENTORY',
    generatedBy: 'Librarian Staff',
    createdAt: '2023-12-01T16:15:00Z',
    size: 3145728, // 3MB
    downloadCount: 8,
    status: 'READY'
  }
];

// GET: Fetch report files
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      reports: mockReports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// DELETE: Remove report files
export async function DELETE(request: NextRequest) {
  try {
    const { reportIds } = await request.json();

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Report IDs are required' },
        { status: 400 }
      );
    }

    // Calculate space that would be freed
    const reportsToDelete = mockReports.filter(report => reportIds.includes(report.id));
    const spaceFreed = reportsToDelete.reduce((total, report) => total + report.size, 0);
    
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return NextResponse.json({
      success: true,
      message: `${reportIds.length} report(s) deleted successfully`,
      deletedCount: reportIds.length,
      spaceFreed: formatBytes(spaceFreed)
    });

  } catch (error) {
    console.error('Error deleting reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete reports' },
      { status: 500 }
    );
  }
}
