const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    console.log('🔍 Checking current transactions...');
    
    const transactions = await prisma.transaction.findMany({
      include: {
        patron: {
          select: {
            patronId: true,
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true
          }
        },
        item: {
          select: {
            itemId: true,
            title: true,
            author: true,
            availableCopies: true
          }
        }
      },
      orderBy: {
        borrowedAt: 'desc'
      }
    });

    console.log(`\n📋 Found ${transactions.length} transactions:\n`);
    
    if (transactions.length === 0) {
      console.log('❌ No transactions found in the database!');
      console.log('💡 This could be why patron "My Books" shows no borrowed books.');
    } else {
      transactions.forEach((txn, i) => {
        console.log(`${i+1}. Transaction ID: ${txn.transactionId}`);
        console.log(`   Book: "${txn.item.title}" by ${txn.item.author} (ID: ${txn.item.itemId})`);
        console.log(`   Patron: ${txn.patron.patronFirstName} ${txn.patron.patronLastName} (ID: ${txn.patron.patronId})`);
        console.log(`   Email: ${txn.patron.patronEmail}`);
        console.log(`   Borrowed: ${txn.borrowedAt}`);
        console.log(`   Due: ${txn.dueDate}`);
        console.log(`   Returned: ${txn.isReturned ? 'YES' : 'NO'}`);
        if (txn.returnedAt) {
          console.log(`   Returned Date: ${txn.returnedAt}`);
        }
        console.log('   ---\n');
      });

      // Check specifically for active transactions
      const activeTransactions = transactions.filter(txn => !txn.isReturned);
      console.log(`📊 Transaction breakdown:`);
      console.log(`   - Active (Not Returned): ${activeTransactions.length}`);
      console.log(`   - Returned: ${transactions.filter(txn => txn.isReturned).length}`);
      
      if (activeTransactions.length > 0) {
        console.log(`\n🔍 Active transactions by patron:`);
        const patronGroups = activeTransactions.reduce((groups, txn) => {
          const key = `${txn.patron.patronFirstName} ${txn.patron.patronLastName} (ID: ${txn.patron.patronId})`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(txn);
          return groups;
        }, {});
        
        Object.entries(patronGroups).forEach(([patron, txns]) => {
          console.log(`   ${patron}: ${txns.length} books`);
          txns.forEach(txn => {
            console.log(`     - "${txn.item.title}"`);
          });
        });
      }
    }

  } catch (error) {
    console.error('❌ Error checking transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();
