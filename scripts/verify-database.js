const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log('📊 Database Status Report');
    console.log('========================');
    
    // Get visible items count
    const visibleCount = await prisma.item.count({
      where: { isVisible: true }
    });
    
    // Get hidden items count
    const hiddenCount = await prisma.item.count({
      where: { isVisible: false }
    });
    
    // Get total count
    const totalCount = await prisma.item.count();
    
    console.log(`✅ Visible Items: ${visibleCount}`);
    console.log(`🔒 Hidden Items: ${hiddenCount}`);
    console.log(`📚 Total Items: ${totalCount}`);
    
    // Get item type breakdown
    const itemTypes = await prisma.item.groupBy({
      by: ['itemType'],
      where: { isVisible: true },
      _count: {
        itemId: true
      }
    });
    
    console.log('\n📖 Item Types Breakdown:');
    itemTypes.forEach(type => {
      console.log(`  - ${type.itemType}: ${type._count.itemId} items`);
    });
    
    // Get availability stats
    const availabilityStats = await prisma.item.aggregate({
      where: { isVisible: true },
      _sum: {
        totalCopies: true,
        availableCopies: true
      },
      _avg: {
        price: true
      }
    });
    
    console.log('\n📈 Library Statistics:');
    console.log(`  - Total Copies: ${availabilityStats._sum.totalCopies}`);
    console.log(`  - Available Copies: ${availabilityStats._sum.availableCopies}`);
    console.log(`  - Average Price: $${availabilityStats._avg.price?.toFixed(2) || '0.00'}`);
    
    // Get some sample items
    const sampleItems = await prisma.item.findMany({
      where: { isVisible: true },
      take: 10,
      orderBy: { itemId: 'asc' },
      select: {
        itemId: true,
        title: true,
        author: true,
        itemType: true,
        totalCopies: true,
        availableCopies: true,
        condition: true
      }
    });
    
    console.log('\n📚 First 10 Items:');
    sampleItems.forEach((item, index) => {
      const status = item.availableCopies === 0 ? '❌ Out of Stock' : 
                    item.availableCopies < item.totalCopies ? '⚠️  Low Stock' : '✅ Available';
      console.log(`  ${index + 1}. "${item.title}" by ${item.author}`);
      console.log(`     Type: ${item.itemType} | Copies: ${item.availableCopies}/${item.totalCopies} | ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyDatabase();
