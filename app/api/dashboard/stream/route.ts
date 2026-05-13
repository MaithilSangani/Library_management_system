import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

interface DashboardEvent {
  type: 'stats_update' | 'new_transaction' | 'overdue_alert' | 'new_patron' | 'system_alert';
  data: any;
  timestamp: string;
}

// Function to broadcast events to all connected clients
function broadcast(event: DashboardEvent) {
  const eventData = `data: ${JSON.stringify(event)}\n\n`;
  
  connections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(eventData));
    } catch (error) {
      // Remove broken connections
      connections.delete(controller);
    }
  });
}

// Function to get dashboard statistics (simplified version)
async function getDashboardStats() {
  try {
    const now = new Date();
    
    const [
      totalPatrons,
      activeTransactions,
      overdueTransactions,
      studentPatrons,
      facultyPatrons
    ] = await Promise.all([
      prisma.patron.count(),
      prisma.transaction.count({ where: { isReturned: false } }),
      prisma.transaction.count({
        where: {
          isReturned: false,
          dueDate: { lt: now }
        }
      }),
      prisma.patron.count({ where: { isStudent: true } }),
      prisma.patron.count({ where: { isFaculty: true } })
    ]);

    return {
      totalPatrons,
      activeTransactions,
      overdueTransactions,
      studentPatrons,
      facultyPatrons,
      generalPatrons: totalPatrons - studentPatrons - facultyPatrons
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

// Function to monitor database changes (simplified polling approach)
async function monitorChanges() {
  let lastStats = await getDashboardStats();
  
  const checkInterval = setInterval(async () => {
    const currentStats = await getDashboardStats();
    
    if (!currentStats || !lastStats) {
      return;
    }

    // Check for significant changes
    const changes: Array<{ type: DashboardEvent['type'], message: string, data: any }> = [];

    // Check for new patrons
    if (currentStats.totalPatrons > lastStats.totalPatrons) {
      changes.push({
        type: 'new_patron',
        message: `${currentStats.totalPatrons - lastStats.totalPatrons} new patron(s) registered`,
        data: { 
          count: currentStats.totalPatrons - lastStats.totalPatrons,
          total: currentStats.totalPatrons
        }
      });
    }

    // Check for transaction changes
    if (currentStats.activeTransactions !== lastStats.activeTransactions) {
      changes.push({
        type: 'new_transaction',
        message: `Transaction count changed: ${currentStats.activeTransactions}`,
        data: {
          previous: lastStats.activeTransactions,
          current: currentStats.activeTransactions,
          change: currentStats.activeTransactions - lastStats.activeTransactions
        }
      });
    }

    // Check for overdue alerts
    if (currentStats.overdueTransactions > lastStats.overdueTransactions) {
      changes.push({
        type: 'overdue_alert',
        message: `New overdue books detected: ${currentStats.overdueTransactions - lastStats.overdueTransactions}`,
        data: {
          newOverdue: currentStats.overdueTransactions - lastStats.overdueTransactions,
          totalOverdue: currentStats.overdueTransactions
        }
      });
    }

    // Check for critical system alerts
    if (currentStats.overdueTransactions >= 10) {
      changes.push({
        type: 'system_alert',
        message: `High number of overdue books: ${currentStats.overdueTransactions}`,
        data: {
          severity: 'high',
          overdueCount: currentStats.overdueTransactions
        }
      });
    }

    // Broadcast changes
    changes.forEach(change => {
      broadcast({
        type: change.type,
        data: {
          ...change.data,
          message: change.message
        },
        timestamp: new Date().toISOString()
      });
    });

    // Always send stats update (even if no changes for heartbeat)
    if (connections.size > 0) {
      broadcast({
        type: 'stats_update',
        data: currentStats,
        timestamp: new Date().toISOString()
      });
    }

    lastStats = currentStats;
  }, 15000); // Check every 15 seconds

  // Clean up when no connections remain
  const cleanupInterval = setInterval(() => {
    if (connections.size === 0) {
      clearInterval(checkInterval);
      clearInterval(cleanupInterval);
    }
  }, 60000); // Check every minute

  return () => {
    clearInterval(checkInterval);
    clearInterval(cleanupInterval);
  };
}

export async function GET(request: NextRequest) {
  // Check authorization
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'guest';
  
  if (role !== 'librarian' && role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      connections.add(controller);
      
      // Send initial connection message
      const welcomeMessage = `data: ${JSON.stringify({
        type: 'connection',
        data: {
          message: 'Connected to dashboard updates',
          connectionId: Date.now().toString(),
          role
        },
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(welcomeMessage));

      // Send initial stats
      getDashboardStats().then(stats => {
        if (stats) {
          const statsMessage = `data: ${JSON.stringify({
            type: 'stats_update',
            data: stats,
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(new TextEncoder().encode(statsMessage));
        }
      });

      // Start monitoring if this is the first connection
      if (connections.size === 1) {
        monitorChanges();
      }
    },
    
    cancel() {
      // Remove connection when client disconnects
      connections.delete(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Export POST method for manual event triggering (for testing or manual notifications)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, data } = body;

    if (!type || !message) {
      return Response.json(
        { error: 'Type and message are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes: DashboardEvent['type'][] = [
      'stats_update', 'new_transaction', 'overdue_alert', 'new_patron', 'system_alert'
    ];

    if (!validTypes.includes(type)) {
      return Response.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Broadcast the event
    broadcast({
      type,
      data: { message, ...data },
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Event broadcasted successfully',
      connections: connections.size
    });

  } catch (error) {
    console.error('Error handling POST request:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
