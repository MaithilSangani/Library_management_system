const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createOverdueTestData() {
  try {
    console.log('🧹 Creating overdue test data...');

    // First, get some existing patrons and items
    const patrons = await prisma.patron.findMany({
      take: 5
    });

    const items = await prisma.item.findMany({
      take: 5
    });

    if (patrons.length === 0) {
      console.log('❌ No patrons found. Please create some patrons first.');
      return;
    }

    if (items.length === 0) {
      console.log('❌ No items found. Please create some items first.');
      return;
    }

    // Create overdue transactions (books that are past their due date)
    const now = new Date();
    const overdueTransactions = [];

    for (let i = 0; i < Math.min(patrons.length, items.length); i++) {
      const patron = patrons[i];
      const item = items[i];

      // Create transaction that is overdue by varying days
      const daysOverdue = Math.floor(Math.random() * 20) + 1; // 1-20 days overdue
      const borrowedAt = new Date(now);
      borrowedAt.setDate(borrowedAt.getDate() - (14 + daysOverdue)); // 14 day loan period + overdue days

      const dueDate = new Date(borrowedAt);
      dueDate.setDate(dueDate.getDate() + 14); // 14 day loan period

      const transaction = await prisma.transaction.create({
        data: {
          patronId: patron.patronId,
          itemId: item.itemId,
          borrowedAt: borrowedAt,
          dueDate: dueDate,
          isReturned: false,
          finePaid: 0,
          renewalCount: 0
        }
      });

      overdueTransactions.push(transaction);
      console.log(`✅ Created overdue transaction: ${item.title} for ${patron.patronFirstName} ${patron.patronLastName} (${daysOverdue} days overdue)`);

      // Update item availability
      await prisma.item.update({
        where: { itemId: item.itemId },
        data: {
          availableCopies: Math.max(0, item.availableCopies - 1)
        }
      });
    }

    console.log(`🎉 Created ${overdueTransactions.length} overdue transactions successfully!`);

  } catch (error) {
    console.error('❌ Error creating overdue test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  createOverdueTestData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createOverdueTestData };
