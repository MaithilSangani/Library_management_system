import { PrismaClient } from '@prisma/client';

interface DatabaseEvent {
  table: string;
  action: 'create' | 'update' | 'delete';
  recordId: string | number;
  data?: any;
  timestamp: Date;
}

// Event listeners for database changes
const eventListeners: Array<(event: DatabaseEvent) => void> = [];

// Function to add event listeners
export function addDatabaseEventListener(callback: (event: DatabaseEvent) => void) {
  eventListeners.push(callback);
}

// Function to remove event listeners
export function removeDatabaseEventListener(callback: (event: DatabaseEvent) => void) {
  const index = eventListeners.indexOf(callback);
  if (index > -1) {
    eventListeners.splice(index, 1);
  }
}

// Function to trigger events
function triggerEvent(event: DatabaseEvent) {
  eventListeners.forEach(callback => {
    try {
      callback(event);
    } catch (error) {
      console.error('Error in database event listener:', error);
    }
  });
}

// Create Prisma instance with middleware
export function createTrackedPrismaClient(): PrismaClient {
  const prisma = new PrismaClient();

  // Add middleware to track database changes
  prisma.$use(async (params, next) => {
    const { model, action, args } = params;
    
    // Execute the query
    const result = await next(params);

    // Only track certain models and actions
    const trackedModels = ['patron', 'transaction', 'reservation', 'item'];
    const trackedActions = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'];

    if (model && trackedModels.includes(model.toLowerCase()) && trackedActions.includes(action)) {
      try {
        let recordId: string | number = 'unknown';
        let eventAction: DatabaseEvent['action'] = 'update';

        // Determine record ID and action type
        switch (action) {
          case 'create':
            eventAction = 'create';
            recordId = result?.patronId || result?.transactionId || result?.reservationId || result?.itemId || 'new';
            break;
          case 'update':
            eventAction = 'update';
            recordId = args?.where?.patronId || args?.where?.transactionId || args?.where?.reservationId || args?.where?.itemId || 'updated';
            break;
          case 'delete':
            eventAction = 'delete';
            recordId = args?.where?.patronId || args?.where?.transactionId || args?.where?.reservationId || args?.where?.itemId || 'deleted';
            break;
          case 'createMany':
            eventAction = 'create';
            recordId = `batch_${result?.count || 0}`;
            break;
          case 'updateMany':
            eventAction = 'update';
            recordId = `batch_${result?.count || 0}`;
            break;
          case 'deleteMany':
            eventAction = 'delete';
            recordId = `batch_${result?.count || 0}`;
            break;
        }

        // Create database event
        const event: DatabaseEvent = {
          table: model.toLowerCase(),
          action: eventAction,
          recordId,
          data: sanitizeData(result),
          timestamp: new Date()
        };

        // Trigger event listeners
        triggerEvent(event);

        // Log significant events
        if (shouldLogEvent(event)) {
          console.log(`[DB Tracker] ${event.action.toUpperCase()} on ${event.table}: ${event.recordId}`);
        }

        // Send to dashboard stream if available
        sendToDashboardStream(event);

      } catch (error) {
        console.error('Error in database tracking middleware:', error);
      }
    }

    return result;
  });

  return prisma;
}

// Function to sanitize data for logging
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Remove sensitive fields
  const sensitiveFields = ['password', 'patronPassword', 'adminPassword', 'librarianPassword'];
  const sanitized = { ...data };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Function to determine if an event should be logged
function shouldLogEvent(event: DatabaseEvent): boolean {
  // Log all patron and transaction events
  if (event.table === 'patron' || event.table === 'transaction') {
    return true;
  }

  // Log reservation events
  if (event.table === 'reservation') {
    return true;
  }

  // Log item events that might affect availability
  if (event.table === 'item' && event.action !== 'update') {
    return true;
  }

  return false;
}

// Function to send events to dashboard stream
function sendToDashboardStream(event: DatabaseEvent) {
  try {
    // Map database events to dashboard events
    let dashboardEventType: string | null = null;
    let message = '';

    switch (event.table) {
      case 'patron':
        if (event.action === 'create') {
          dashboardEventType = 'new_patron';
          message = 'New patron registered';
        }
        break;
      
      case 'transaction':
        if (event.action === 'create') {
          dashboardEventType = 'new_transaction';
          message = 'New book borrowed';
        } else if (event.action === 'update') {
          dashboardEventType = 'new_transaction';
          message = 'Transaction updated';
        }
        break;
      
      case 'reservation':
        if (event.action === 'create') {
          dashboardEventType = 'new_transaction';
          message = 'New book reserved';
        }
        break;
    }

    // Send to dashboard stream API if we have a relevant event
    if (dashboardEventType) {
      fetch('/api/dashboard/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: dashboardEventType,
          message,
          data: {
            table: event.table,
            action: event.action,
            recordId: event.recordId,
            timestamp: event.timestamp.toISOString()
          }
        })
      }).catch(error => {
        // Silently handle errors as this is non-critical
        console.debug('Failed to send event to dashboard stream:', error.message);
      });
    }

  } catch (error) {
    console.debug('Error sending event to dashboard stream:', error);
  }
}

// Utility functions for specific tracking needs
export class DatabaseTracker {
  private listeners: Array<(event: DatabaseEvent) => void> = [];

  addListener(callback: (event: DatabaseEvent) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (event: DatabaseEvent) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Method to manually trigger events (for testing or special cases)
  triggerEvent(table: string, action: DatabaseEvent['action'], recordId: string | number, data?: any) {
    const event: DatabaseEvent = {
      table,
      action,
      recordId,
      data,
      timestamp: new Date()
    };

    triggerEvent(event);
    sendToDashboardStream(event);
  }

  // Method to get event statistics
  async getEventStats(prisma: PrismaClient, hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    try {
      const [
        patronsCreated,
        transactionsCreated,
        reservationsCreated
      ] = await Promise.all([
        prisma.patron.count({
          where: {
            patronCreatedAt: { gte: since }
          }
        }),
        prisma.transaction.count({
          where: {
            borrowedAt: { gte: since }
          }
        }),
        prisma.reservation.count({
          where: {
            reservedAt: { gte: since }
          }
        })
      ]);

      return {
        period: `${hours} hours`,
        patronsCreated,
        transactionsCreated,
        reservationsCreated,
        totalEvents: patronsCreated + transactionsCreated + reservationsCreated
      };

    } catch (error) {
      console.error('Error getting event stats:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const databaseTracker = new DatabaseTracker();

// Export the tracked Prisma client
export const trackedPrisma = createTrackedPrismaClient();
