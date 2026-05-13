const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseUserWorkflow() {
  try {
    console.log('🔍 COMPREHENSIVE USER WORKFLOW DIAGNOSIS');
    console.log('=' + '='.repeat(60));

    // Step 1: Check current state
    console.log('\n📊 Step 1: Current System State');
    console.log('-'.repeat(40));

    const [patrons, librarians, pendingRequests, approvedRequests, activeTransactions] = await Promise.all([
      prisma.patron.count(),
      prisma.librarian.count(),
      prisma.borrowrequest.count({ where: { status: 'PENDING' } }),
      prisma.borrowrequest.count({ where: { status: 'APPROVED' } }),
      prisma.transaction.count({ where: { isReturned: false } })
    ]);

    console.log(`👥 Total Patrons: ${patrons}`);
    console.log(`👨‍💼 Total Librarians: ${librarians}`);
    console.log(`⏳ Pending Requests: ${pendingRequests}`);
    console.log(`✅ Approved Requests: ${approvedRequests}`);
    console.log(`📚 Active Transactions: ${activeTransactions}`);

    // Step 2: Analyze the issue reported by user
    console.log('\n🔍 Step 2: Analyzing User Issues');
    console.log('-'.repeat(40));

    console.log('\n🚨 ISSUE 1: "No requests in librarian panel"');
    if (pendingRequests === 0) {
      console.log('✅ EXPLANATION: This is CORRECT behavior!');
      console.log('   The librarian panel shows no requests because there are 0 PENDING requests.');
      console.log('   All requests have already been processed (approved/rejected).');
      console.log('   📝 SOLUTION: Create a new borrow request to test the librarian panel.');
    } else {
      console.log('❌ PROBLEM: There are pending requests but they may not be showing in frontend.');
      console.log('   📝 This indicates a frontend or authentication issue.');
    }

    console.log('\n🚨 ISSUE 2: "Issued books not showing in My Books"');
    if (activeTransactions > 0) {
      console.log('✅ EXPLANATION: Books ARE being issued correctly!');
      console.log(`   There are ${activeTransactions} active transactions (borrowed books).`);
      console.log('   📝 SOLUTION: The issue is likely in the frontend or user authentication.');
    } else {
      console.log('❌ PROBLEM: No active transactions found despite approved requests.');
      console.log('   📝 This indicates an issue in the request approval process.');
    }

    // Step 3: Check specific patron data
    console.log('\n📚 Step 3: Checking Patron Data');
    console.log('-'.repeat(40));

    const patronsWithBooks = await prisma.patron.findMany({
      include: {
        transaction: {
          where: { isReturned: false },
          include: {
            item: {
              select: {
                title: true,
                author: true
              }
            }
          }
        }
      },
      take: 5
    });

    console.log(`\n🔍 Sample of patrons and their active books:`);
    patronsWithBooks.forEach((patron, i) => {
      console.log(`${i+1}. ${patron.patronFirstName} ${patron.patronLastName} (ID: ${patron.patronId})`);
      console.log(`   Email: ${patron.patronEmail}`);
      console.log(`   Active books: ${patron.transaction.length}`);
      if (patron.transaction.length > 0) {
        patron.transaction.forEach((trans, j) => {
          console.log(`   ${j+1}. "${trans.item.title}" by ${trans.item.author}`);
        });
      }
      console.log('   ---');
    });

    // Step 4: Test API endpoints (simulated)
    console.log('\n🌐 Step 4: API Endpoint Analysis');
    console.log('-'.repeat(40));

    console.log('\n📋 Testing Librarian Borrow Requests API:');
    console.log('   Endpoint: GET /api/librarian/borrow-requests?status=PENDING');
    console.log(`   Expected result: ${pendingRequests} requests`);
    if (pendingRequests === 0) {
      console.log('   ✅ Correct: No pending requests to display');
    } else {
      console.log('   ❓ Check: Ensure frontend is calling this API correctly');
    }

    console.log('\n📚 Testing Patron Books API:');
    const samplePatron = patronsWithBooks.find(p => p.transaction.length > 0);
    if (samplePatron) {
      console.log(`   Endpoint: GET /api/patron/books?patronId=${samplePatron.patronId}`);
      console.log(`   Expected result: ${samplePatron.transaction.length} books`);
      console.log('   ✅ Data available in database');
    } else {
      console.log('   ⚠️ No patron with active books found');
    }

    // Step 5: Create test scenario
    console.log('\n🧪 Step 5: Creating Test Scenario');
    console.log('-'.repeat(40));

    console.log('\n📝 Creating a new test borrow request to verify the complete workflow...');

    // Find a patron and available book
    const testPatron = await prisma.patron.findFirst({
      where: { patronId: 2 } // Deep Vaghamasi
    });

    const availableBook = await prisma.item.findFirst({
      where: {
        availableCopies: { gt: 0 },
        isVisible: true
      }
    });

    if (testPatron && availableBook) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const testRequest = await prisma.borrowrequest.create({
        data: {
          patronId: testPatron.patronId,
          itemId: availableBook.itemId,
          notes: 'TEST REQUEST - Created by diagnostic script to verify workflow',
          expiresAt: expiresAt
        }
      });

      console.log('✅ Test request created successfully!');
      console.log(`   Request ID: ${testRequest.requestId}`);
      console.log(`   Patron: ${testPatron.patronFirstName} ${testPatron.patronLastName}`);
      console.log(`   Book: "${availableBook.title}"`);
      console.log(`   Status: ${testRequest.status} (should be PENDING)`);

      // Now the librarian panel should show 1 pending request
      console.log('\n📋 NOW TEST THE LIBRARIAN PANEL:');
      console.log('   1. Go to the librarian panel');
      console.log('   2. You should see 1 pending request');
      console.log('   3. Approve the request');
      console.log('   4. Check the patron\'s "My Books" section');

    } else {
      console.log('❌ Could not create test request - missing patron or available book');
    }

    // Step 6: Recommendations
    console.log('\n💡 Step 6: Recommendations');
    console.log('-'.repeat(40));

    console.log('\n🛠️ IMMEDIATE ACTIONS:');
    console.log('1. Start your Next.js development server: npm run dev');
    console.log('2. Test the librarian panel - it should now show 1 pending request');
    console.log('3. Log in as a librarian and approve the test request');
    console.log('4. Log in as the patron and check "My Books"');

    console.log('\n🔧 IF ISSUES PERSIST:');
    console.log('1. Check browser console for frontend errors');
    console.log('2. Verify user authentication (patronId/librarianEmail in session)');
    console.log('3. Check network tab to see if API calls are being made');
    console.log('4. Verify the auth context is providing correct user data');

    console.log('\n📋 COMMON FRONTEND ISSUES TO CHECK:');
    console.log('• User authentication - ensure patronId is available in AuthContext');
    console.log('• API calls - check if fetch requests are being made correctly');
    console.log('• Network errors - check for CORS or connection issues');
    console.log('• State management - ensure React state is updating properly');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseUserWorkflow();
