const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPatronBooksAPI() {
  try {
    console.log('🧪 Testing Patron Books API Logic...\n');

    // Test for patron ID 2 (Deep Vaghamasi)
    const testPatronId = 2;
    
    console.log(`1. Testing API logic for patron ID ${testPatronId}:`);
    
    // Replicate exact API logic
    const whereClause = {
      patronId: testPatronId,
      isReturned: false  // Only active loans (same as API when includeHistory = false)
    };
    
    console.log('   Where clause:', whereClause);
    
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
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
        { isReturned: 'asc' }, // Active loans first
        { borrowedAt: 'desc' }
      ]
    });

    console.log(`   📊 Query returned ${transactions.length} transactions`);
    
    if (transactions.length === 0) {
      console.log('   ❌ No active transactions found!');
      
      // Check if patron exists
      const patron = await prisma.patron.findUnique({
        where: { patronId: testPatronId },
        select: { patronFirstName: true, patronLastName: true, patronEmail: true }
      });
      
      if (patron) {
        console.log(`   ✅ Patron exists: ${patron.patronFirstName} ${patron.patronLastName} (${patron.patronEmail})`);
        
        // Check ALL transactions for this patron
        const allTransactions = await prisma.transaction.findMany({
          where: { patronId: testPatronId },
          include: { item: { select: { title: true } } }
        });
        
        console.log(`   📋 Total transactions for patron: ${allTransactions.length}`);
        allTransactions.forEach((t, i) => {
          console.log(`      ${i + 1}. "${t.item.title}" - ${t.isReturned ? 'RETURNED' : 'ACTIVE'}`);
        });
        
      } else {
        console.log('   ❌ Patron does not exist!');
      }
      
      return;
    }

    // Calculate additional information (same as API)
    const transactionsWithDetails = transactions.map(transaction => {
      const today = new Date();
      const dueDate = new Date(transaction.dueDate);
      
      let status = 'active';
      let daysOverdue = 0;
      let fine = 0;
      
      if (transaction.isReturned) {
        status = 'returned';
      } else if (dueDate < today) {
        status = 'overdue';
        daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        fine = daysOverdue * 1; // $1 per day
      }

      return {
        ...transaction,
        status,
        daysOverdue,
        fine,
        dueDate: transaction.dueDate.toISOString(),
        borrowedAt: transaction.borrowedAt.toISOString(),
        returnedAt: transaction.returnedAt?.toISOString() || null
      };
    });

    // Separate current loans and history (same as API)
    const currentLoans = transactionsWithDetails.filter(t => !t.isReturned);
    const history = transactionsWithDetails.filter(t => t.isReturned);

    // Calculate statistics (same as API)
    const stats = {
      totalBorrowed: currentLoans.length,
      overdueBooks: currentLoans.filter(t => t.status === 'overdue').length,
      totalFines: currentLoans.reduce((sum, t) => sum + (t.fine || 0), 0),
      booksRead: history.length,
      currentBorrowingLimit: 5
    };

    console.log('\n✅ API would return:');
    console.log('   📊 Stats:', stats);
    console.log(`   📚 Current loans: ${currentLoans.length}`);
    currentLoans.forEach((loan, index) => {
      console.log(`      ${index + 1}. "${loan.item.title}" by ${loan.item.author}`);
      console.log(`         Status: ${loan.status}, Due: ${loan.dueDate.split('T')[0]}, Fine: $${loan.fine}`);
    });

    console.log('\n🧪 Testing actual HTTP API call...');
    
    // Test the actual HTTP API (requires server to be running)
    try {
      const response = await fetch(`http://localhost:3000/api/patron/books?patronId=${testPatronId}`);
      
      if (response.ok) {
        const apiResult = await response.json();
        console.log('✅ HTTP API Response:', {
          currentLoansCount: apiResult.currentLoans?.length || 0,
          statsTotal: apiResult.stats?.totalBorrowed || 0,
          success: apiResult.success
        });
        
        if (apiResult.currentLoans?.length > 0) {
          console.log('📚 HTTP API returned books:');
          apiResult.currentLoans.forEach((book, i) => {
            console.log(`   ${i + 1}. "${book.item.title}" by ${book.item.author}`);
          });
        } else {
          console.log('❌ HTTP API returned no books!');
        }
      } else {
        console.log(`❌ HTTP API failed: ${response.status} ${response.statusText}`);
      }
    } catch (httpError) {
      console.log('❌ HTTP API test failed (server not running?):', httpError.message);
      console.log('💡 Make sure to run "npm run dev" first to test HTTP API');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Include fetch polyfill for Node.js
global.fetch = global.fetch || (async (url, options = {}) => {
  try {
    const { default: nodeFetch } = await import('node-fetch');
    return nodeFetch(url, { timeout: 5000, ...options });
  } catch (e) {
    throw new Error(`Fetch not available: ${e.message}`);
  }
});

testPatronBooksAPI();
