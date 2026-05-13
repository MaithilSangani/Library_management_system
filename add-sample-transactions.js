const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleTransactions() {
  try {
    console.log('🎯 Adding diverse sample transaction data...\n');

    // First, let's check what items and patrons we have
    const items = await prisma.item.findMany({ take: 10 });
    const patrons = await prisma.patron.findMany({ take: 10 });

    console.log(`📚 Found ${items.length} items in database`);
    console.log(`👥 Found ${patrons.length} patrons in database`);

    if (items.length === 0 || patrons.length === 0) {
      console.log('❌ Need items and patrons in database first!');
      return;
    }

    // Create various transaction scenarios
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sampleTransactions = [
      // Active loan (recent)
      {
        patronId: patrons[0].patronId,
        itemId: items[0]?.itemId,
        borrowedAt: oneWeekAgo,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Due next week
        isReturned: false
      },
      // Overdue loan
      {
        patronId: patrons[0].patronId,
        itemId: items[1]?.itemId,
        borrowedAt: oneMonthAgo,
        dueDate: twoWeeksAgo, // Overdue
        isReturned: false
      },
      // Returned loan (with rating)
      {
        patronId: patrons.length > 1 ? patrons[1].patronId : patrons[0].patronId,
        itemId: items[2]?.itemId,
        borrowedAt: oneMonthAgo,
        dueDate: twoWeeksAgo,
        returnedAt: oneWeekAgo,
        isReturned: true,
        rating: 5,
        review: 'Excellent book, very helpful for my studies!'
      },
      // Another active loan (different patron if available)
      {
        patronId: patrons.length > 1 ? patrons[1].patronId : patrons[0].patronId,
        itemId: items[3]?.itemId,
        borrowedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        dueDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000), // Due in 11 days
        isReturned: false
      },
      // Old returned loan
      {
        patronId: patrons[0].patronId,
        itemId: items[4]?.itemId,
        borrowedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
        dueDate: new Date(now.getTime() - 46 * 24 * 60 * 60 * 1000),
        returnedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        isReturned: true,
        rating: 4,
        review: 'Good reference material.'
      }
    ];

    console.log('📝 Creating sample transactions...\n');

    let successCount = 0;
    for (const [index, transactionData] of sampleTransactions.entries()) {
      if (!transactionData.itemId) {
        console.log(`⚠️  Skipping transaction ${index + 1}: No item available`);
        continue;
      }

      try {
        const transaction = await prisma.transaction.create({
          data: transactionData,
          include: {
            patron: {
              select: {
                patronFirstName: true,
                patronLastName: true,
              }
            },
            item: {
              select: {
                title: true,
                author: true,
              }
            }
          }
        });

        successCount++;
        console.log(`✅ Created Transaction #${transaction.transactionId}`);
        console.log(`   📖 ${transaction.item.title} by ${transaction.item.author}`);
        console.log(`   👤 ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`);
        console.log(`   📅 Borrowed: ${transaction.borrowedAt.toLocaleDateString()}`);
        console.log(`   📅 Due: ${transaction.dueDate.toLocaleDateString()}`);
        console.log(`   ✅ Status: ${transaction.isReturned ? 'Returned' : 'Active'}`);
        if (transaction.rating) console.log(`   ⭐ Rating: ${transaction.rating}/5`);
        if (transaction.review) console.log(`   💬 Review: ${transaction.review}`);
        console.log('');

      } catch (error) {
        console.log(`❌ Failed to create transaction ${index + 1}: ${error.message}`);
      }
    }

    console.log(`🎉 Successfully created ${successCount} sample transactions!`);
    
    // Show updated totals
    const totalTransactions = await prisma.transaction.count();
    const activeCount = await prisma.transaction.count({ where: { isReturned: false } });
    const returnedCount = await prisma.transaction.count({ where: { isReturned: true } });
    
    console.log(`\n📊 Updated Database Statistics:`);
    console.log(`   📚 Total Transactions: ${totalTransactions}`);
    console.log(`   🔄 Active Loans: ${activeCount}`);
    console.log(`   ✅ Returned Books: ${returnedCount}`);

    console.log(`\n💡 Now refresh your transaction history page to see the diverse data!`);

  } catch (error) {
    console.error('❌ Error adding sample transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleTransactions();
