import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ItemStatus, ItemCondition } from '@prisma/client';
import { 
  calculateItemStatus, 
  getStatusStatistics, 
  getItemsNeedingAttention,
  logStatusChange,
  type ItemWithRelations 
} from '@/app/lib/itemStatus';

const prisma = new PrismaClient();

// GET /api/items/status - Get status overview and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'statistics'; // statistics, overdue, attention
    
    // Get all items with relations for status calculation
    const items = await prisma.item.findMany({
      where: { isVisible: true },
      include: {
        transaction: {
          select: {
            transactionId: true,
            isReturned: true,
            dueDate: true,
            borrowedAt: true,
            returnedAt: true,
          }
        },
        reservation: {
          select: {
            reservationId: true,
            reservedAt: true,
          }
        }
      }
    }) as ItemWithRelations[];

    switch (type) {
      case 'statistics':
        const statistics = getStatusStatistics(items);
        return NextResponse.json({
          type: 'statistics',
          data: statistics
        });

      case 'overdue':
        const overdueItems = items
          .map(item => ({
            ...item,
            statusInfo: calculateItemStatus(item)
          }))
          .filter(item => item.statusInfo.status === ItemStatus.OVERDUE)
          .sort((a, b) => b.statusInfo.priority - a.statusInfo.priority);

        return NextResponse.json({
          type: 'overdue',
          data: {
            count: overdueItems.length,
            items: overdueItems
          }
        });

      case 'attention':
        const itemsNeedingAttention = getItemsNeedingAttention(items);
        const itemsWithStatus = itemsNeedingAttention.map(item => ({
          ...item,
          statusInfo: calculateItemStatus(item)
        }));

        return NextResponse.json({
          type: 'attention',
          data: {
            count: itemsWithStatus.length,
            items: itemsWithStatus
          }
        });

      case 'all':
        const allItemsWithStatus = items.map(item => ({
          itemId: item.itemId,
          title: item.title,
          author: item.author,
          statusInfo: calculateItemStatus(item)
        }));

        return NextResponse.json({
          type: 'all',
          data: {
            count: allItemsWithStatus.length,
            items: allItemsWithStatus,
            statistics: getStatusStatistics(items)
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: statistics, overdue, attention, or all' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching item status data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item status data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH /api/items/status - Update item condition or maintenance status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, condition, maintenanceNotes, changedBy, reason } = body;

    // Validate required fields
    if (!itemId || !changedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, changedBy' },
        { status: 400 }
      );
    }

    // Validate condition if provided
    if (condition && !Object.values(ItemCondition).includes(condition)) {
      return NextResponse.json(
        { error: 'Invalid condition. Must be one of: ' + Object.values(ItemCondition).join(', ') },
        { status: 400 }
      );
    }

    // Get current item with relations
    const currentItem = await prisma.item.findUnique({
      where: { itemId: parseInt(itemId) },
      include: {
        transaction: {
          select: {
            transactionId: true,
            isReturned: true,
            dueDate: true,
            borrowedAt: true,
            returnedAt: true,
          }
        },
        reservation: {
          select: {
            reservationId: true,
            reservedAt: true,
          }
        }
      }
    }) as ItemWithRelations | null;

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Calculate current status
    const currentStatusInfo = calculateItemStatus(currentItem);

    // Update item
    const updateData: any = {};
    if (condition) {
      updateData.condition = condition;
    }
    if (maintenanceNotes !== undefined) {
      updateData.maintenanceNotes = maintenanceNotes;
    }

    const updatedItem = await prisma.item.update({
      where: { itemId: parseInt(itemId) },
      data: updateData,
      include: {
        transaction: {
          select: {
            transactionId: true,
            isReturned: true,
            dueDate: true,
            borrowedAt: true,
            returnedAt: true,
          }
        },
        reservation: {
          select: {
            reservationId: true,
            reservedAt: true,
          }
        }
      }
    }) as ItemWithRelations;

    // Calculate new status
    const newStatusInfo = calculateItemStatus(updatedItem);

    // Log status change if status actually changed
    if (currentStatusInfo.status !== newStatusInfo.status) {
      await logStatusChange(
        parseInt(itemId),
        newStatusInfo.status,
        currentStatusInfo.status,
        reason || 'Manual status update',
        changedBy,
        maintenanceNotes,
        prisma
      );
    }

    return NextResponse.json({
      message: 'Item status updated successfully',
      item: updatedItem,
      statusInfo: newStatusInfo,
      previousStatus: currentStatusInfo.status !== newStatusInfo.status ? currentStatusInfo.status : null
    });

  } catch (error) {
    console.error('Error updating item status:', error);
    return NextResponse.json(
      { error: 'Failed to update item status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/items/status - Bulk status operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, itemIds, condition, maintenanceNotes, changedBy, reason } = body;

    if (!operation || !itemIds || !Array.isArray(itemIds) || !changedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, itemIds (array), changedBy' },
        { status: 400 }
      );
    }

    const results = [];

    switch (operation) {
      case 'mark_maintenance':
        for (const itemId of itemIds) {
          try {
            const item = await prisma.item.update({
              where: { itemId: parseInt(itemId) },
              data: {
                condition: condition || ItemCondition.GOOD,
                maintenanceNotes: maintenanceNotes || 'Under maintenance'
              }
            });

            await logStatusChange(
              parseInt(itemId),
              ItemStatus.UNDER_MAINTENANCE,
              null,
              reason || 'Bulk maintenance operation',
              changedBy,
              maintenanceNotes,
              prisma
            );

            results.push({ itemId, success: true });
          } catch (error) {
            results.push({ itemId, success: false, error: error.message });
          }
        }
        break;

      case 'mark_damaged':
        for (const itemId of itemIds) {
          try {
            const item = await prisma.item.update({
              where: { itemId: parseInt(itemId) },
              data: {
                condition: ItemCondition.DAMAGED,
                maintenanceNotes: maintenanceNotes || 'Item marked as damaged'
              }
            });

            await logStatusChange(
              parseInt(itemId),
              ItemStatus.DAMAGED,
              null,
              reason || 'Bulk damage marking',
              changedBy,
              maintenanceNotes,
              prisma
            );

            results.push({ itemId, success: true });
          } catch (error) {
            results.push({ itemId, success: false, error: error.message });
          }
        }
        break;

      case 'restore_condition':
        for (const itemId of itemIds) {
          try {
            const item = await prisma.item.update({
              where: { itemId: parseInt(itemId) },
              data: {
                condition: condition || ItemCondition.GOOD,
                maintenanceNotes: null
              }
            });

            await logStatusChange(
              parseInt(itemId),
              ItemStatus.AVAILABLE,
              null,
              reason || 'Bulk condition restoration',
              changedBy,
              'Condition restored',
              prisma
            );

            results.push({ itemId, success: true });
          } catch (error) {
            results.push({ itemId, success: false, error: error.message });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Use: mark_maintenance, mark_damaged, restore_condition' },
          { status: 400 }
        );
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Bulk operation completed: ${successCount} successful, ${failureCount} failed`,
      operation,
      results: {
        successful: successCount,
        failed: failureCount,
        details: results
      }
    });

  } catch (error) {
    console.error('Error performing bulk status operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk status operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
