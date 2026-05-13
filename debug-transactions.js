const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTransactions() {
  try {
    console.log('🔍 Debugging Transaction System...\n');

    // 1. Check total transactions
    const totalTransactions = await prisma.transaction.count();
    console.log(`📊 Total transactions in database: ${totalTransactions}`);

    // 2. Check all transactions with details
    const allTransactions = await prisma.transaction.findMany({
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true, patronEmail: true } },
        item: { select: { title: true, author: true } }
      },
      orderBy: { borrowedAt: 'desc' }
    });

    console.log(`\n📋 All transactions:`);
    allTransactions.forEach((transaction, index) => {
      console.log(`  ${index + 1}. Transaction #${transaction.transactionId}`);
      console.log(`     📖 Book: "${transaction.item.title}" by ${transaction.item.author}`);
      console.log(`     👤 Patron: ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`);
      console.log(`     📅 Borrowed: ${transaction.borrowedAt}`);
      console.log(`     📅 Due: ${transaction.dueDate}`);
      console.log(`     ✅ Returned: ${transaction.isReturned ? 'Yes' : 'No'}`);
      if (transaction.returnedAt) {
        console.log(`     📅 Returned Date: ${transaction.returnedAt}`);
      }
      console.log('');
    });

    // 3. Check active transactions (not returned)
    const activeTransactions = await prisma.transaction.findMany({
      where: { isReturned: false },
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true, patronEmail: true, patronId: true } },
        item: { select: { title: true, author: true } }
      },
      orderBy: { borrowedAt: 'desc' }
    });

    console.log(`\n📖 Active transactions (not returned): ${activeTransactions.length}`);
    activeTransactions.forEach((transaction, index) => {
      console.log(`  ${index + 1}. Patron ID ${transaction.patron.patronId}: ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`);
      console.log(`     📖 Book: "${transaction.item.title}"`);
      console.log(`     📅 Due: ${transaction.dueDate}`);
      console.log('');
    });

    // 4. Check transactions for specific patrons
    const patronIds = [2, 3, 11]; // Known patron IDs from our previous tests
    
    for (const patronId of patronIds) {
      console.log(`\n👤 Checking transactions for patron ID ${patronId}:`);
      
      const patronTransactions = await prisma.transaction.findMany({
        where: { patronId: patronId },
        include: {
          item: { select: { title: true, author: true } }
        },
        orderBy: { borrowedAt: 'desc' }
      });

      const patron = await prisma.patron.findUnique({
        where: { patronId: patronId },
        select: { patronFirstName: true, patronLastName: true, patronEmail: true }
      });

      if (patron) {
        console.log(`   Name: ${patron.patronFirstName} ${patron.patronLastName} (${patron.patronEmail})`);
        console.log(`   Total transactions: ${patronTransactions.length}`);
        console.log(`   Active loans: ${patronTransactions.filter(t => !t.isReturned).length}`);
        console.log(`   Returned books: ${patronTransactions.filter(t => t.isReturned).length}`);
        
        if (patronTransactions.length > 0) {
          console.log(`   📚 Books:`);
          patronTransactions.forEach((t, i) => {
            console.log(`      ${i + 1}. "${t.item.title}" - ${t.isReturned ? 'Returned' : 'Active'} (Due: ${t.dueDate.toDateString()})`);
          });
        }
      } else {
        console.log(`   ❌ Patron not found`);
      }
    }

    // 5. Test the exact API logic for patron books
    console.log(`\n🧪 Testing API logic for patron ID 2:`);
    
    const testPatronId = 2;
    const testTransactions = await prisma.transaction.findMany({
      where: {
        patronId: testPatronId,
        isReturned: false  // Only active loans (same as API)
      },
      include: {
        item: {
          select: {
            itemId: true,
            title: true,
            author: true,
            isbn: true,
            subject: true,
            itemType: true,
            condition: true,
            imageUrl: true
          }
        }
      },
      orderBy: [
        { isReturned: 'asc' },
        { borrowedAt: 'desc' }
      ]
    });

    console.log(`   📊 API would return ${testTransactions.length} active loans`);
    
    if (testTransactions.length === 0) {
      console.log(`   ❌ No active loans found for patron ID ${testPatronId}`);
      console.log(`   💡 This explains why "My Books" shows no books!`);
      
      // Check if this patron has ANY transactions
      const allPatronTransactions = await prisma.transaction.findMany({
        where: { patronId: testPatronId },
        include: { item: { select: { title: true } } }
      });
      
      console.log(`   📋 Total transactions for this patron: ${allPatronTransactions.length}`);
      if (allPatronTransactions.length > 0) {
        console.log(`   📚 All transactions:`);
        allPatronTransactions.forEach((t, i) => {
          console.log(`      ${i + 1}. "${t.item.title}" - ${t.isReturned ? 'RETURNED' : 'ACTIVE'}`);
        });
      }
    } else {
      console.log(`   ✅ Found active loans - these should appear in "My Books"`);
      testTransactions.forEach((t, i) => {
        console.log(`      ${i + 1}. "${t.item.title}" by ${t.item.author} (Due: ${t.dueDate.toDateString()})`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTransactions();
