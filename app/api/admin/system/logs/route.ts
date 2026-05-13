import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// GET: Fetch system logs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = {};

    // Apply filters
    if (level && level !== 'ALL') {
      whereClause.level = level;
    }

    if (source && source !== 'ALL') {
      whereClause.source = source;
    }

    if (search) {
      whereClause.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (dateFrom || dateTo) {
      whereClause.timestamp = {};
      if (dateFrom) whereClause.timestamp.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.timestamp.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.systemLog.count({ where: whereClause })
    ]);

    // Get distinct sources for filtering
    const sources = await prisma.systemLog.findMany({
      select: { source: true },
      distinct: ['source'],
      orderBy: { source: 'asc' }
    });

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id.toString(),
        level: log.level,
        message: log.message,
        timestamp: log.timestamp.toISOString(),
        source: log.source,
        userId: log.userId,
        ip: log.ip
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      sources: sources.map(s => s.source)
    });

  } catch (error) {
    console.error('Error fetching system logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system logs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Remove selected system logs
export async function DELETE(request: NextRequest) {
  try {
    const { logIds } = await request.json();

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Log IDs are required' },
        { status: 400 }
      );
    }

    // Convert string IDs to numbers
    const numericIds = logIds.map(id => parseInt(id)).filter(id => !isNaN(id));

    if (numericIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid log IDs are required' },
        { status: 400 }
      );
    }

    const deleteResult = await prisma.systemLog.deleteMany({
      where: {
        id: { in: numericIds }
      }
    });

    // Log the deletion action
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: `Admin deleted ${deleteResult.count} system log entries`,
        source: 'SYSTEM_MANAGEMENT',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} log entries deleted successfully`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error('Error deleting system logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete system logs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
