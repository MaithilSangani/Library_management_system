const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteTransactions() {
  try {
    console.log('🗑️  Transaction Deletion Script\n');

    // First, let's see what transactions we have
    const existingTransactions = await prisma.transaction.findMany({
      include: {
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true
          }
        },
        item: {
          select: {
            title: true,
            author: true
          }
        }
      },
      orderBy: {
        transactionId: 'asc'
      }
    });

    console.log(`📊 Found ${existingTransactions.length} transactions in database:\n`);

    existingTransactions.forEach((transaction, index) => {
      console.log(`${index + 1}. Transaction #${transaction.transactionId}`);
      console.log(`   📖 ${transaction.item.title} by ${transaction.item.author}`);
      console.log(`   👤 ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`);
      console.log(`   📅 Borrowed: ${transaction.borrowedAt.toLocaleDateString()}`);
      console.log(`   ✅ Status: ${transaction.isReturned ? 'Returned' : 'Active'}\n`);
    });

    // Ask user what they want to delete
    console.log('🤔 What would you like to delete?\n');
    console.log('Options:');
    console.log('1. Delete ALL transactions');
    console.log('2. Delete specific transaction by ID');
    console.log('3. Delete only sample transactions (newest 5)');
    console.log('4. Delete only returned transactions');
    console.log('5. Delete only active transactions');
    console.log('6. Cancel - don\'t delete anything\n');

    // For this script, I'll provide different deletion methods
    // You can uncomment the one you want to use

    // METHOD 1: Delete ALL transactions (CAREFUL!)
    // await deleteAllTransactions();

    // METHOD 2: Delete specific transaction by ID
    // await deleteTransactionById(1); // Replace 1 with the ID you want

    // METHOD 3: Delete newest 5 transactions (sample data)
    await deleteNewestTransactions(5);

    // METHOD 4: Delete only returned transactions  
    // await deleteReturnedTransactions();

    // METHOD 5: Delete only active transactions
    // await deleteActiveTransactions();

    console.log('\n✅ Transaction deletion completed!');
    
    // Show updated stats
    await showUpdatedStats();

  } catch (error) {
    console.error('❌ Error deleting transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Method 1: Delete ALL transactions
async function deleteAllTransactions() {
  console.log('⚠️  DELETING ALL TRANSACTIONS...\n');
  
  try {
    // First delete related records (fine payments)
    const deletedFinePayments = await prisma.finepayment.deleteMany();
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    // Then delete all transactions
    const deletedTransactions = await prisma.transaction.deleteMany();
    console.log(`🗑️  Deleted ${deletedTransactions.count} transactions`);

  } catch (error) {
    console.error('❌ Error deleting all transactions:', error);
  }
}

// Method 2: Delete specific transaction by ID
async function deleteTransactionById(transactionId) {
  console.log(`⚠️  DELETING TRANSACTION #${transactionId}...\n`);
  
  try {
    // First delete related fine payments
    const deletedFinePayments = await prisma.finepayment.deleteMany({
      where: { transactionId }
    });
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    // Then delete the transaction
    const deletedTransaction = await prisma.transaction.delete({
      where: { transactionId }
    });
    console.log(`🗑️  Deleted transaction #${deletedTransaction.transactionId}`);

  } catch (error) {
    console.error(`❌ Error deleting transaction #${transactionId}:`, error);
  }
}

// Method 3: Delete newest N transactions
async function deleteNewestTransactions(count) {
  console.log(`⚠️  DELETING NEWEST ${count} TRANSACTIONS...\n`);
  
  try {
    // Get the newest transactions
    const newestTransactions = await prisma.transaction.findMany({
      orderBy: { transactionId: 'desc' },
      take: count,
      select: { transactionId: true }
    });

    const transactionIds = newestTransactions.map(t => t.transactionId);
    console.log(`🎯 Target transactions: ${transactionIds.join(', ')}`);

    // Delete related fine payments first
    const deletedFinePayments = await prisma.finepayment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    // Delete the transactions
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedTransactions.count} transactions`);

  } catch (error) {
    console.error('❌ Error deleting newest transactions:', error);
  }
}

// Method 4: Delete only returned transactions
async function deleteReturnedTransactions() {
  console.log('⚠️  DELETING RETURNED TRANSACTIONS...\n');
  
  try {
    // Get returned transaction IDs
    const returnedTransactions = await prisma.transaction.findMany({
      where: { isReturned: true },
      select: { transactionId: true }
    });

    const transactionIds = returnedTransactions.map(t => t.transactionId);
    console.log(`🎯 Found ${transactionIds.length} returned transactions`);

    if (transactionIds.length === 0) {
      console.log('ℹ️  No returned transactions to delete');
      return;
    }

    // Delete related fine payments first
    const deletedFinePayments = await prisma.finepayment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    // Delete the transactions
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { isReturned: true }
    });
    console.log(`🗑️  Deleted ${deletedTransactions.count} returned transactions`);

  } catch (error) {
    console.error('❌ Error deleting returned transactions:', error);
  }
}

// Method 5: Delete only active transactions
async function deleteActiveTransactions() {
  console.log('⚠️  DELETING ACTIVE TRANSACTIONS...\n');
  
  try {
    // Get active transaction IDs
    const activeTransactions = await prisma.transaction.findMany({
      where: { isReturned: false },
      select: { transactionId: true }
    });

    const transactionIds = activeTransactions.map(t => t.transactionId);
    console.log(`🎯 Found ${transactionIds.length} active transactions`);

    if (transactionIds.length === 0) {
      console.log('ℹ️  No active transactions to delete');
      return;
    }

    // Delete related fine payments first
    const deletedFinePayments = await prisma.finepayment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    // Delete the transactions
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { isReturned: false }
    });
    console.log(`🗑️  Deleted ${deletedTransactions.count} active transactions`);

  } catch (error) {
    console.error('❌ Error deleting active transactions:', error);
  }
}

// Show updated database stats
async function showUpdatedStats() {
  const totalTransactions = await prisma.transaction.count();
  const activeCount = await prisma.transaction.count({ where: { isReturned: false } });
  const returnedCount = await prisma.transaction.count({ where: { isReturned: true } });
  const totalFinePayments = await prisma.finepayment.count();
  
  console.log(`📊 Updated Database Statistics:`);
  console.log(`   📚 Total Transactions: ${totalTransactions}`);
  console.log(`   🔄 Active Loans: ${activeCount}`);
  console.log(`   ✅ Returned Books: ${returnedCount}`);
  console.log(`   💰 Fine Payment Records: ${totalFinePayments}`);
}

// Run the deletion script
deleteTransactions();
