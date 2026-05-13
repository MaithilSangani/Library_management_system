const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseUIIssues() {
  try {
    console.log('🔍 DIAGNOSING UI COMMUNICATION ISSUES');
    console.log('=' + '='.repeat(50));
    
    // Check 1: Pending requests for librarian panel
    console.log('\n📋 1. LIBRARIAN PANEL - PENDING REQUESTS:');
    const pendingRequests = await prisma.borrowrequest.findMany({
      where: { status: 'PENDING' },
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
        requestedAt: 'desc'
      }
    });
    
    if (pendingRequests.length === 0) {
      console.log('❌ NO PENDING REQUESTS FOUND!');
      console.log('💡 This explains why librarian panel shows no requests.');
      console.log('💡 Solution: Create a new request using create-fresh-test-request.js');
    } else {
      console.log(`✅ Found ${pendingRequests.length} pending requests:`);
      pendingRequests.forEach((req, i) => {
        console.log(`   ${i+1}. Request ID: ${req.requestId}`);
        console.log(`      Book: "${req.item.title}" by ${req.item.author}`);
        console.log(`      Patron: ${req.patron.patronFirstName} ${req.patron.patronLastName} (ID: ${req.patron.patronId})`);
        console.log(`      Requested: ${req.requestedAt}`);
        console.log(`      API URL to test: /api/librarian/borrow-requests?status=PENDING`);
      });
    }
    
    // Check 2: Active transactions for patron "My Books"
    console.log('\n📚 2. PATRON "MY BOOKS" - ACTIVE TRANSACTIONS:');
    const patrons = await prisma.patron.findMany({
      where: {
        patronId: { in: [2, 11, 3] } // Test specific patrons
      }
    });
    
    for (const patron of patrons) {
      console.log(`\n👤 Patron: ${patron.patronFirstName} ${patron.patronLastName} (ID: ${patron.patronId})`);
      
      const activeTransactions = await prisma.transaction.findMany({
        where: {
          patronId: patron.patronId,
          isReturned: false
        },
        include: {
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
      
      if (activeTransactions.length === 0) {
        console.log('   ❌ No active borrowed books');
        console.log(`   💡 API URL to test: /api/patron/books?patronId=${patron.patronId}`);
      } else {
        console.log(`   ✅ Has ${activeTransactions.length} active borrowed books:`);
        activeTransactions.forEach((txn, i) => {
          console.log(`      ${i+1}. "${txn.item.title}" by ${txn.item.author}`);
          console.log(`         Transaction ID: ${txn.transactionId}`);
          console.log(`         Borrowed: ${txn.borrowedAt}`);
          console.log(`         Due: ${txn.dueDate}`);
        });
        console.log(`   💡 API URL to test: /api/patron/books?patronId=${patron.patronId}`);
      }
    }
    
    // Check 3: Recent activity summary
    console.log('\n📊 3. RECENT ACTIVITY SUMMARY:');
    const recentRequests = await prisma.borrowrequest.findMany({
      take: 5,
      orderBy: { requestedAt: 'desc' },
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true } },
        item: { select: { title: true } }
      }
    });
    
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { borrowedAt: 'desc' },
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true } },
        item: { select: { title: true } }
      }
    });
    
    console.log('\n🔄 Recent Requests:');
    recentRequests.forEach((req, i) => {
      console.log(`   ${i+1}. ${req.patron.patronFirstName} ${req.patron.patronLastName} requested "${req.item.title}" - ${req.status}`);
    });
    
    console.log('\n📖 Recent Transactions:');
    recentTransactions.forEach((txn, i) => {
      console.log(`   ${i+1}. ${txn.patron.patronFirstName} ${txn.patron.patronLastName} borrowed "${txn.item.title}" - ${txn.isReturned ? 'RETURNED' : 'ACTIVE'}`);
    });
    
    // Check 4: Frontend testing instructions
    console.log('\n🧪 4. FRONTEND TESTING INSTRUCTIONS:');
    console.log('');
    console.log('📝 To test the complete workflow:');
    console.log('');
    console.log('A. TEST LIBRARIAN PANEL:');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Open: http://localhost:3000/login');
    console.log('   3. Login as librarian (check your user credentials)');
    console.log('   4. Go to: Borrow Requests page');
    console.log('   5. Check browser DevTools Network tab for API calls');
    console.log('   6. API should call: GET /api/librarian/borrow-requests?status=PENDING');
    console.log('');
    console.log('B. TEST PATRON PANEL:');
    console.log('   1. Login as patron (ID: 2, 11, or 3)');
    console.log('   2. Go to: My Books page'); 
    console.log('   3. Check browser DevTools Network tab for API calls');
    console.log('   4. API should call: GET /api/patron/books?patronId=[ID]');
    console.log('');
    console.log('C. TEST COMPLETE FLOW:');
    console.log('   1. As patron: Request a book from catalog');
    console.log('   2. As librarian: Go to Borrow Requests and approve it');
    console.log('   3. As patron: Check My Books to see the approved book');
    
    // Check 5: Common issues and solutions
    console.log('\n🔧 5. COMMON ISSUES & SOLUTIONS:');
    console.log('');
    console.log('❌ Issue: No requests in librarian panel');
    console.log('✅ Solution: Run "node create-fresh-test-request.js" to create a test request');
    console.log('');
    console.log('❌ Issue: Books not showing in patron "My Books"');
    console.log('✅ Solution: Check authentication - user.patronId must exist');
    console.log('✅ Solution: Check API response in browser DevTools');
    console.log('✅ Solution: Verify transactions exist in database (see active transactions above)');
    console.log('');
    console.log('❌ Issue: API errors');
    console.log('✅ Solution: Check Next.js console for server-side errors');
    console.log('✅ Solution: Check browser console for client-side errors');
    console.log('✅ Solution: Verify database connection and Prisma schema');
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error in diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseUIIssues();
