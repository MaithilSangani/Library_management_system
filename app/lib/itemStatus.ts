import { ItemStatus, ItemCondition } from '@/app/generated/prisma';

// Type definitions for item data with relations
export interface ItemWithRelations {
  itemId: number;
  totalCopies: number;
  availableCopies: number;
  condition?: ItemCondition;
  maintenanceNotes?: string | null;
  isVisible: boolean;
  transaction: Array<{
    transactionId: number;
    isReturned: boolean;
    dueDate: Date;
    borrowedAt: Date;
    returnedAt?: Date | null;
  }>;
  reservation: Array<{
    reservationId: number;
    reservedAt: Date;
  }>;
}

export interface ItemStatusInfo {
  status: ItemStatus;
  priority: number; // Higher number = higher priority for display
  description: string;
  canBorrow: boolean;
  availableCopies: number;
  borrowedCopies: number;
  reservedCopies: number;
  overdueCopies: number;
}

/**
 * Calculate the current status of an item based on its transactions, reservations, and condition
 */
export function calculateItemStatus(item: ItemWithRelations): ItemStatusInfo {
  const now = new Date();
  
  // Count different types of copies
  const activeBorrowings = item.transaction.filter(t => !t.isReturned);
  const borrowedCopies = activeBorrowings.length;
  const overdueCopies = activeBorrowings.filter(t => t.dueDate < now).length;
  const reservedCopies = item.reservation.length;
  
  // Check condition-based statuses first (highest priority)
  if (!item.isVisible) {
    return {
      status: ItemStatus.LOST, // or could be a separate "INACTIVE" status
      priority: 100,
      description: 'Item is not visible/active in the system',
      canBorrow: false,
      availableCopies: 0,
      borrowedCopies,
      reservedCopies,
      overdueCopies
    };
  }

  if (item.condition === ItemCondition.DAMAGED || item.condition === ItemCondition.UNUSABLE) {
    return {
      status: ItemStatus.DAMAGED,
      priority: 90,
      description: `Item is in ${item.condition.toLowerCase()} condition${item.maintenanceNotes ? ': ' + item.maintenanceNotes : ''}`,
      canBorrow: false,
      availableCopies: 0,
      borrowedCopies,
      reservedCopies,
      overdueCopies
    };
  }

  if (item.maintenanceNotes && item.maintenanceNotes.toLowerCase().includes('maintenance')) {
    return {
      status: ItemStatus.UNDER_MAINTENANCE,
      priority: 85,
      description: `Under maintenance: ${item.maintenanceNotes}`,
      canBorrow: false,
      availableCopies: 0,
      borrowedCopies,
      reservedCopies,
      overdueCopies
    };
  }

  // Check for overdue copies (high priority)
  if (overdueCopies > 0) {
    const availableForBorrow = Math.max(0, item.totalCopies - borrowedCopies);
    return {
      status: ItemStatus.OVERDUE,
      priority: 80,
      description: `${overdueCopies} cop${overdueCopies === 1 ? 'y is' : 'ies are'} overdue`,
      canBorrow: availableForBorrow > 0,
      availableCopies: availableForBorrow,
      borrowedCopies,
      reservedCopies,
      overdueCopies
    };
  }

  // Check availability
  if (item.totalCopies === 0) {
    return {
      status: ItemStatus.OUT_OF_STOCK,
      priority: 70,
      description: 'No copies available in inventory',
      canBorrow: false,
      availableCopies: 0,
      borrowedCopies,
      reservedCopies,
      overdueCopies
    };
  }

  const actualAvailableCopies = Math.max(0, item.totalCopies - borrowedCopies);
  
  if (actualAvailableCopies === 0) {
    if (reservedCopies > 0) {
      return {
        status: ItemStatus.RESERVED,
        priority: 40,
        description: `All copies borrowed, ${reservedCopies} reservation${reservedCopies === 1 ? '' : 's'} pending`,
        canBorrow: false,
        availableCopies: 0,
        borrowedCopies,
        reservedCopies,
        overdueCopies
      };
    } else {
      return {
        status: ItemStatus.BORROWED,
        priority: 50,
        description: 'All copies currently borrowed',
        canBorrow: false,
        availableCopies: 0,
        borrowedCopies,
        reservedCopies,
        overdueCopies
      };
    }
  }

  // Item is available
  if (reservedCopies > 0) {
    return {
      status: ItemStatus.RESERVED,
      priority: 30,
      description: `${actualAvailableCopies} cop${actualAvailableCopies === 1 ? 'y' : 'ies'} available, ${reservedCopies} reservation${reservedCopies === 1 ? '' : 's'}`,
      canBorrow: true,
      availableCopies: actualAvailableCopies,
      borrowedCopies,
      reservedCopies,
      overdueCopies
    };
  }

  return {
    status: ItemStatus.AVAILABLE,
    priority: 10,
    description: `${actualAvailableCopies} cop${actualAvailableCopies === 1 ? 'y' : 'ies'} available`,
    canBorrow: true,
    availableCopies: actualAvailableCopies,
    borrowedCopies,
    reservedCopies,
    overdueCopies
  };
}

/**
 * Get status badge color based on item status
 */
export function getStatusBadgeColor(status: ItemStatus): string {
  switch (status) {
    case ItemStatus.AVAILABLE:
      return 'bg-green-100 text-green-800 border-green-200';
    case ItemStatus.BORROWED:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case ItemStatus.RESERVED:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case ItemStatus.OVERDUE:
      return 'bg-red-100 text-red-800 border-red-200';
    case ItemStatus.UNDER_MAINTENANCE:
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case ItemStatus.DAMAGED:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case ItemStatus.LOST:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case ItemStatus.OUT_OF_STOCK:
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get display text for status
 */
export function getStatusDisplayText(status: ItemStatus): string {
  switch (status) {
    case ItemStatus.AVAILABLE:
      return 'Available';
    case ItemStatus.BORROWED:
      return 'Borrowed';
    case ItemStatus.RESERVED:
      return 'Reserved';
    case ItemStatus.OVERDUE:
      return 'Overdue';
    case ItemStatus.UNDER_MAINTENANCE:
      return 'Under Maintenance';
    case ItemStatus.DAMAGED:
      return 'Damaged';
    case ItemStatus.LOST:
      return 'Lost';
    case ItemStatus.OUT_OF_STOCK:
      return 'Out of Stock';
    default:
      return 'Unknown';
  }
}

/**
 * Check if an item can be borrowed based on its status
 */
export function canItemBeBorrowed(statusInfo: ItemStatusInfo): boolean {
  return statusInfo.canBorrow && statusInfo.availableCopies > 0;
}

/**
 * Get items that need attention (overdue, damaged, etc.)
 */
export function getItemsNeedingAttention(items: ItemWithRelations[]): ItemWithRelations[] {
  return items
    .map(item => ({
      item,
      status: calculateItemStatus(item)
    }))
    .filter(({ status }) => 
      status.status === ItemStatus.OVERDUE ||
      status.status === ItemStatus.DAMAGED ||
      status.status === ItemStatus.LOST ||
      status.status === ItemStatus.UNDER_MAINTENANCE
    )
    .sort((a, b) => b.status.priority - a.status.priority)
    .map(({ item }) => item);
}

/**
 * Get statistics about item statuses
 */
export function getStatusStatistics(items: ItemWithRelations[]) {
  const stats = {
    [ItemStatus.AVAILABLE]: 0,
    [ItemStatus.BORROWED]: 0,
    [ItemStatus.RESERVED]: 0,
    [ItemStatus.OVERDUE]: 0,
    [ItemStatus.UNDER_MAINTENANCE]: 0,
    [ItemStatus.DAMAGED]: 0,
    [ItemStatus.LOST]: 0,
    [ItemStatus.OUT_OF_STOCK]: 0,
  };

  const statusDetails = {
    totalItems: items.length,
    totalCopies: 0,
    availableCopies: 0,
    borrowedCopies: 0,
    overdueCopies: 0,
    reservedCopies: 0,
    itemsNeedingAttention: 0,
  };

  items.forEach(item => {
    const statusInfo = calculateItemStatus(item);
    stats[statusInfo.status]++;
    
    statusDetails.totalCopies += item.totalCopies;
    statusDetails.availableCopies += statusInfo.availableCopies;
    statusDetails.borrowedCopies += statusInfo.borrowedCopies;
    statusDetails.overdueCopies += statusInfo.overdueCopies;
    statusDetails.reservedCopies += statusInfo.reservedCopies;
    
    if (statusInfo.priority >= 70) { // High priority items need attention
      statusDetails.itemsNeedingAttention++;
    }
  });

  return {
    statusCounts: stats,
    summary: statusDetails
  };
}

/**
 * Filter items by status
 */
export function filterItemsByStatus(items: ItemWithRelations[], targetStatus: ItemStatus): ItemWithRelations[] {
  return items.filter(item => {
    const statusInfo = calculateItemStatus(item);
    return statusInfo.status === targetStatus;
  });
}

/**
 * Log status change for audit trail
 */
export async function logStatusChange(
  itemId: number,
  newStatus: ItemStatus,
  previousStatus: ItemStatus | null,
  reason: string,
  changedBy: string,
  notes?: string,
  prismaClient?: any // PrismaClient type
) {
  if (!prismaClient) {
    console.warn('No Prisma client provided for status logging');
    return;
  }

  try {
    await prismaClient.itemStatusHistory.create({
      data: {
        itemId,
        status: newStatus,
        previousStatus,
        reason,
        changedBy,
        notes,
      }
    });
  } catch (error) {
    console.error('Failed to log status change:', error);
  }
}
