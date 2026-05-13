const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showTransactionMenu() {
  try {
    console.log('🗑️  Transaction Deletion Tool\n');
    console.log('Choose what to delete:\n');
    console.log('Available deletion methods:');
    console.log('─'.repeat(50));
    
    // Show current statistics first
    const totalTransactions = await prisma.transaction.count();
    const activeCount = await prisma.transaction.count({ where: { isReturned: false } });
    const returnedCount = await prisma.transaction.count({ where: { isReturned: true } });
    
    console.log(`📊 Current Database Stats:`);
    console.log(`   📚 Total Transactions: ${totalTransactions}`);
    console.log(`   🔄 Active Loans: ${activeCount}`);
    console.log(`   ✅ Returned Books: ${returnedCount}`);
    console.log('─'.repeat(50));
    
    console.log('\n📋 Deletion Options:');
    console.log('1. 🗑️  Delete ALL transactions (⚠️  DANGEROUS)');
    console.log('2. 🎯 Delete specific transaction by ID');
    console.log('3. 📦 Delete newest N transactions');
    console.log('4. ✅ Delete only returned transactions');
    console.log('5. 🔄 Delete only active transactions');
    console.log('6. 📅 Delete transactions by date range');
    console.log('7. 👤 Delete transactions by patron');
    console.log('8. 📖 Delete transactions by book/item');
    console.log('9. 📊 Just show transaction list');
    console.log('0. ❌ Cancel and exit\n');
    
    // For demonstration, I'll show how to use each method:
    
    // UNCOMMENT THE METHOD YOU WANT TO USE:
    
    // Example 1: Delete all transactions (BE VERY CAREFUL!)
    // await deleteAllTransactions();
    
    // Example 2: Delete specific transaction by ID
    // await deleteTransactionById(3);
    
    // Example 3: Delete newest 3 transactions
    // await deleteNewestTransactions(3);
    
    // Example 4: Delete only returned transactions
    // await deleteReturnedTransactions();
    
    // Example 5: Delete only active transactions
    // await deleteActiveTransactions();
    
    // Example 6: Delete transactions in date range
    // await deleteTransactionsByDateRange('2025-08-01', '2025-08-31');
    
    // Example 7: Delete transactions by patron ID
    // await deleteTransactionsByPatron(1);
    
    // Example 8: Delete transactions by item ID
    // await deleteTransactionsByItem(1);
    
    // By default, just show the transaction list
    await showTransactionList();

  } catch (error) {
    console.error('❌ Error in transaction deletion tool:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function showTransactionList() {
  console.log('📋 Current Transactions:\n');
  
  const transactions = await prisma.transaction.findMany({
    include: {
      patron: {
        select: {
          patronFirstName: true,
          patronLastName: true,
          patronEmail: true
        }
      },
      item: {
        select: {
          title: true,
          author: true,
          isbn: true
        }
      }
    },
    orderBy: {
      transactionId: 'asc'
    }
  });

  if (transactions.length === 0) {
    console.log('ℹ️  No transactions found in database.');
    return;
  }

  transactions.forEach((transaction, index) => {
    const status = transaction.isReturned ? '✅ Returned' : '🔄 Active';
    const overdue = !transaction.isReturned && new Date(transaction.dueDate) < new Date() ? ' (⚠️ OVERDUE)' : '';
    
    console.log(`${index + 1}. Transaction #${transaction.transactionId} ${status}${overdue}`);
    console.log(`   📖 ${transaction.item.title}`);
    console.log(`   ✍️  by ${transaction.item.author}`);
    console.log(`   👤 ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName} (${transaction.patron.patronEmail})`);
    console.log(`   📅 Borrowed: ${new Date(transaction.borrowedAt).toLocaleDateString()}`);
    console.log(`   📅 Due: ${new Date(transaction.dueDate).toLocaleDateString()}`);
    if (transaction.returnedAt) {
      console.log(`   📅 Returned: ${new Date(transaction.returnedAt).toLocaleDateString()}`);
    }
    if (transaction.rating) {
      console.log(`   ⭐ Rating: ${transaction.rating}/5`);
    }
    if (transaction.review) {
      console.log(`   💬 Review: ${transaction.review}`);
    }
    console.log('');
  });
}

async function deleteAllTransactions() {
  console.log('⚠️  WARNING: DELETING ALL TRANSACTIONS!\n');
  console.log('This will remove ALL transaction data from your database.');
  console.log('This action cannot be undone!\n');
  
  try {
    // Count before deletion
    const totalBefore = await prisma.transaction.count();
    console.log(`🎯 Found ${totalBefore} transactions to delete`);
    
    // Delete related records first
    const deletedFinePayments = await prisma.finepayment.deleteMany();
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    const deletedPayments = await prisma.payment.deleteMany({
      where: { transactionId: { not: null } }
    });
    console.log(`🗑️  Deleted ${deletedPayments.count} payment records`);

    // Delete all transactions
    const deletedTransactions = await prisma.transaction.deleteMany();
    console.log(`🗑️  Deleted ${deletedTransactions.count} transactions`);

    console.log('\n✅ All transactions deleted successfully!');

  } catch (error) {
    console.error('❌ Error deleting all transactions:', error);
  }
}

async function deleteTransactionById(transactionId) {
  console.log(`🎯 Deleting transaction #${transactionId}...\n`);
  
  try {
    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { transactionId },
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true } },
        item: { select: { title: true, author: true } }
      }
    });

    if (!transaction) {
      console.log(`❌ Transaction #${transactionId} not found!`);
      return;
    }

    console.log(`📖 ${transaction.item.title} by ${transaction.item.author}`);
    console.log(`👤 ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`);
    console.log(`📅 Borrowed: ${new Date(transaction.borrowedAt).toLocaleDateString()}\n`);

    // Delete related records first
    const deletedFinePayments = await prisma.finepayment.deleteMany({
      where: { transactionId }
    });
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    const deletedPayments = await prisma.payment.deleteMany({
      where: { transactionId }
    });
    console.log(`🗑️  Deleted ${deletedPayments.count} payment records`);

    // Delete the transaction
    const deletedTransaction = await prisma.transaction.delete({
      where: { transactionId }
    });
    console.log(`🗑️  Deleted transaction #${deletedTransaction.transactionId}`);

  } catch (error) {
    console.error(`❌ Error deleting transaction #${transactionId}:`, error);
  }
}

async function deleteNewestTransactions(count) {
  console.log(`🎯 Deleting newest ${count} transactions...\n`);
  
  try {
    const newestTransactions = await prisma.transaction.findMany({
      orderBy: { transactionId: 'desc' },
      take: count,
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true } },
        item: { select: { title: true } }
      }
    });

    if (newestTransactions.length === 0) {
      console.log('ℹ️  No transactions found to delete');
      return;
    }

    console.log(`Found ${newestTransactions.length} transactions to delete:`);
    newestTransactions.forEach(t => {
      console.log(`- Transaction #${t.transactionId}: ${t.item.title} (${t.patron.patronFirstName} ${t.patron.patronLastName})`);
    });
    console.log('');

    const transactionIds = newestTransactions.map(t => t.transactionId);

    // Delete related records
    const deletedFinePayments = await prisma.finepayment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    const deletedPayments = await prisma.payment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedPayments.count} payment records`);

    // Delete transactions
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedTransactions.count} transactions`);

  } catch (error) {
    console.error('❌ Error deleting newest transactions:', error);
  }
}

async function deleteReturnedTransactions() {
  console.log('🎯 Deleting all returned transactions...\n');
  
  try {
    const returnedTransactions = await prisma.transaction.findMany({
      where: { isReturned: true },
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true } },
        item: { select: { title: true } }
      }
    });

    if (returnedTransactions.length === 0) {
      console.log('ℹ️  No returned transactions found');
      return;
    }

    console.log(`Found ${returnedTransactions.length} returned transactions:`);
    returnedTransactions.forEach(t => {
      console.log(`- Transaction #${t.transactionId}: ${t.item.title} (${t.patron.patronFirstName} ${t.patron.patronLastName})`);
    });
    console.log('');

    const transactionIds = returnedTransactions.map(t => t.transactionId);

    // Delete related records
    const deletedFinePayments = await prisma.finepayment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    const deletedPayments = await prisma.payment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedPayments.count} payment records`);

    // Delete transactions
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { isReturned: true }
    });
    console.log(`🗑️  Deleted ${deletedTransactions.count} returned transactions`);

  } catch (error) {
    console.error('❌ Error deleting returned transactions:', error);
  }
}

async function deleteActiveTransactions() {
  console.log('🎯 Deleting all active transactions...\n');
  
  try {
    const activeTransactions = await prisma.transaction.findMany({
      where: { isReturned: false },
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true } },
        item: { select: { title: true } }
      }
    });

    if (activeTransactions.length === 0) {
      console.log('ℹ️  No active transactions found');
      return;
    }

    console.log(`Found ${activeTransactions.length} active transactions:`);
    activeTransactions.forEach(t => {
      const overdue = new Date(t.dueDate) < new Date() ? ' (⚠️ OVERDUE)' : '';
      console.log(`- Transaction #${t.transactionId}: ${t.item.title} (${t.patron.patronFirstName} ${t.patron.patronLastName})${overdue}`);
    });
    console.log('');

    const transactionIds = activeTransactions.map(t => t.transactionId);

    // Delete related records
    const deletedFinePayments = await prisma.finepayment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedFinePayments.count} fine payment records`);

    const deletedPayments = await prisma.payment.deleteMany({
      where: { transactionId: { in: transactionIds } }
    });
    console.log(`🗑️  Deleted ${deletedPayments.count} payment records`);

    // Delete transactions
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { isReturned: false }
    });
    console.log(`🗑️  Deleted ${deletedTransactions.count} active transactions`);

  } catch (error) {
    console.error('❌ Error deleting active transactions:', error);
  }
}

// Run the menu
showTransactionMenu();
