const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCollectionData() {
  try {
    console.log('🔍 Testing Collection Statistics...\n');

    // Test basic counts
    const totalItems = await prisma.item.count({ where: { isVisible: true } });
    console.log(`📚 Total Items: ${totalItems}`);

    // Test items by type
    const itemsByType = await prisma.item.groupBy({
      by: ['itemType'],
      _count: { itemType: true },
      where: { isVisible: true }
    });
    console.log('\n📊 Items by Type:');
    itemsByType.forEach(type => {
      console.log(`  - ${type.itemType}: ${type._count.itemType}`);
    });

    // Test total and available copies
    const copiesStats = await prisma.item.aggregate({
      where: { isVisible: true },
      _sum: {
        totalCopies: true,
        availableCopies: true
      }
    });
    console.log(`\n📦 Total Copies: ${copiesStats._sum.totalCopies || 0}`);
    console.log(`✅ Available Copies: ${copiesStats._sum.availableCopies || 0}`);
    console.log(`📖 Borrowed Copies: ${(copiesStats._sum.totalCopies || 0) - (copiesStats._sum.availableCopies || 0)}`);

    // Test transactions
    const activeTransactions = await prisma.transaction.count({ 
      where: { isReturned: false } 
    });
    console.log(`\n🔄 Active Transactions: ${activeTransactions}`);

    const overdueTransactions = await prisma.transaction.count({
      where: {
        isReturned: false,
        dueDate: { lt: new Date() }
      }
    });
    console.log(`⚠️  Overdue Transactions: ${overdueTransactions}`);

    // Test item conditions
    const itemConditions = await prisma.item.groupBy({
      by: ['condition'],
      _count: { condition: true },
      where: { isVisible: true }
    });
    console.log('\n🏥 Items by Condition:');
    itemConditions.forEach(cond => {
      console.log(`  - ${cond.condition}: ${cond._count.condition}`);
    });

    // Test most borrowed items
    const mostBorrowed = await prisma.transaction.groupBy({
      by: ['itemId'],
      _count: { itemId: true },
      orderBy: { _count: { itemId: 'desc' } },
      take: 5
    });
    
    if (mostBorrowed.length > 0) {
      const itemIds = mostBorrowed.map(r => r.itemId);
      const items = await prisma.item.findMany({
        where: { itemId: { in: itemIds } },
        select: { itemId: true, title: true, author: true }
      });
      
      console.log('\n🔥 Most Borrowed Items:');
      mostBorrowed.forEach(borrowed => {
        const item = items.find(i => i.itemId === borrowed.itemId);
        console.log(`  - "${item?.title || 'Unknown'}" by ${item?.author || 'Unknown'}: ${borrowed._count.itemId} times`);
      });
    } else {
      console.log('\n🔥 Most Borrowed Items: No data available');
    }

    // Test recent activity
    const recentTransactions = await prisma.transaction.count({
      where: {
        borrowedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    console.log(`\n📈 Transactions (Last 7 days): ${recentTransactions}`);

    // Calculate utilization rate
    const utilizationRate = totalItems > 0 ? ((activeTransactions / totalItems) * 100).toFixed(1) : '0.0';
    console.log(`\n📊 Collection Utilization Rate: ${utilizationRate}%`);

    console.log('\n✅ Collection data test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing collection data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCollectionData();
