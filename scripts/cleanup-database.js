const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('🔄 Starting database cleanup...');
    
    // Get total count of items
    const totalCount = await prisma.item.count({
      where: { isVisible: true }
    });
    
    console.log(`📊 Total items in database: ${totalCount}`);
    
    if (totalCount <= 50) {
      console.log('✅ Database already has 50 or fewer items. No cleanup needed.');
      return;
    }
    
    // Get the first 50 items (keeping the oldest/most established ones)
    const itemsToKeep = await prisma.item.findMany({
      where: { isVisible: true },
      orderBy: { itemId: 'asc' },
      take: 50,
      select: { itemId: true }
    });
    
    const keepIds = itemsToKeep.map(item => item.itemId);
    console.log(`📝 Keeping ${keepIds.length} items (IDs: ${keepIds[0]} to ${keepIds[keepIds.length - 1]})`);
    
    // Soft delete items beyond the first 50
    const deleteResult = await prisma.item.updateMany({
      where: {
        isVisible: true,
        itemId: {
          notIn: keepIds
        }
      },
      data: {
        isVisible: false
      }
    });
    
    console.log(`🗑️ Soft-deleted ${deleteResult.count} items (marked as not visible)`);
    
    // Get updated count
    const remainingCount = await prisma.item.count({
      where: { isVisible: true }
    });
    
    console.log(`✅ Database cleanup completed! Remaining visible items: ${remainingCount}`);
    
    // Show a sample of the remaining items
    const sampleItems = await prisma.item.findMany({
      where: { isVisible: true },
      take: 5,
      select: {
        itemId: true,
        title: true,
        author: true,
        itemType: true,
        totalCopies: true,
        availableCopies: true
      }
    });
    
    console.log('\n📚 Sample of remaining items:');
    sampleItems.forEach(item => {
      console.log(`  - ID: ${item.itemId}, Title: "${item.title}" by ${item.author} (${item.itemType})`);
    });
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase();
