const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactionData() {
  try {
    console.log('🔍 Checking database connectivity and transaction data...\n');

    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if there are any transactions
    const transactionCount = await prisma.transaction.count();
    console.log(`📊 Total transactions in database: ${transactionCount}`);

    if (transactionCount === 0) {
      console.log('\n❌ No transaction data found in the database!');
      console.log('📝 You need to add some transaction data for the transaction history to show real data.');
      
      // Let's check related data
      const itemCount = await prisma.item.count();
      const patronCount = await prisma.patron.count();
      
      console.log(`\n📚 Items in database: ${itemCount}`);
      console.log(`👥 Patrons in database: ${patronCount}`);
      
      if (itemCount > 0 && patronCount > 0) {
        console.log('\n💡 You have items and patrons - we can create some sample transactions!');
      } else {
        console.log('\n⚠️  You need to add items and patrons first before creating transactions.');
      }
    } else {
      // Show some sample transaction data
      console.log('\n✅ Found transaction data! Here are some samples:');
      
      const sampleTransactions = await prisma.transaction.findMany({
        take: 3,
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
          borrowedAt: 'desc'
        }
      });

      sampleTransactions.forEach((transaction, index) => {
        console.log(`\n${index + 1}. Transaction #${transaction.transactionId}`);
        console.log(`   📖 Book: "${transaction.item.title}" by ${transaction.item.author}`);
        console.log(`   👤 Patron: ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`);
        console.log(`   📅 Borrowed: ${transaction.borrowedAt.toLocaleDateString()}`);
        console.log(`   📅 Due: ${transaction.dueDate.toLocaleDateString()}`);
        console.log(`   ✅ Returned: ${transaction.isReturned ? 'Yes' : 'No'}`);
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Database connection failed. Please check:');
      console.log('   - Is your database server running?');
      console.log('   - Are your DATABASE_URL credentials correct in .env?');
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed.');
  }
}

checkTransactionData();
