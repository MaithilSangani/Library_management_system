const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugNewPatronRequests() {
  try {
    console.log('🔍 DEBUGGING NEW PATRON REQUEST ISSUES');
    console.log('=' + '='.repeat(50));
    
    // Step 1: Check all patrons in the database
    console.log('\n👥 1. ALL PATRONS IN DATABASE:');
    const allPatrons = await prisma.patron.findMany({
      orderBy: { patronId: 'asc' }
    });
    
    console.log(`Found ${allPatrons.length} patrons:`);
    allPatrons.forEach((patron, i) => {
      console.log(`   ${i+1}. ID: ${patron.patronId} - ${patron.patronFirstName} ${patron.patronLastName} (${patron.patronEmail})`);
      console.log(`      Created: ${patron.createdAt || 'Unknown'}`);
      console.log(`      Student: ${patron.isStudent}, Faculty: ${patron.isFaculty}`);
    });
    
    // Step 2: Check if there's a specific "Nirav" patron
    console.log('\n🔍 2. SEARCHING FOR NIRAV:');
    const niravPatrons = await prisma.patron.findMany({
      where: {
        OR: [
          { patronFirstName: { contains: 'Nirav' } },
          { patronLastName: { contains: 'Nirav' } },
          { patronEmail: { contains: 'nirav' } }
        ]
      }
    });
    
    if (niravPatrons.length === 0) {
      console.log('❌ No patron named Nirav found in database');
    } else {
      console.log(`✅ Found ${niravPatrons.length} Nirav patron(s):`);
      niravPatrons.forEach((patron) => {
        console.log(`   ID: ${patron.patronId} - ${patron.patronFirstName} ${patron.patronLastName} (${patron.patronEmail})`);
      });
    }
    
    // Step 3: Check requests by patron ID to see which ones work
    console.log('\n📋 3. REQUESTS BY PATRON ID:');
    const requestsByPatron = await prisma.borrowrequest.groupBy({
      by: ['patronId'],
      _count: {
        requestId: true
      },
      orderBy: {
        patronId: 'asc'
      }
    });
    
    console.log('Requests count by patron ID:');
    for (const group of requestsByPatron) {
      const patron = allPatrons.find(p => p.patronId === group.patronId);
      console.log(`   Patron ID ${group.patronId} (${patron?.patronFirstName} ${patron?.patronLastName}): ${group._count.requestId} requests`);
    }
    
    // Step 4: Find patrons with NO requests
    const patronsWithoutRequests = allPatrons.filter(patron => 
      !requestsByPatron.some(group => group.patronId === patron.patronId)
    );
    
    console.log(`\n❌ ${patronsWithoutRequests.length} patrons have NEVER made requests:`);
    patronsWithoutRequests.forEach(patron => {
      console.log(`   ID: ${patron.patronId} - ${patron.patronFirstName} ${patron.patronLastName} (${patron.patronEmail})`);
    });
    
    // Step 5: Test creating a request for a problematic patron
    console.log('\n🧪 4. TESTING REQUEST CREATION FOR NEW PATRON:');
    
    // Find the latest patron (most recently created)
    const latestPatron = allPatrons[allPatrons.length - 1];
    console.log(`Testing with latest patron: ID ${latestPatron.patronId} - ${latestPatron.patronFirstName} ${latestPatron.patronLastName}`);
    
    // Find an available book
    const availableBook = await prisma.item.findFirst({
      where: { 
        availableCopies: { gt: 0 },
        isVisible: true
      }
    });
    
    if (!availableBook) {
      console.log('❌ No available books found for testing');
      return;
    }
    
    console.log(`Using book: "${availableBook.title}" (ID: ${availableBook.itemId})`);
    
    // Try to create a request
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const testRequest = await prisma.borrowrequest.create({
        data: {
          patronId: latestPatron.patronId,
          itemId: availableBook.itemId,
          notes: 'DEBUG: Testing request creation for new patron',
          expiresAt: expiresAt,
        }
      });
      
      console.log(`✅ Successfully created test request ID: ${testRequest.requestId}`);
      console.log(`   Status: ${testRequest.status}`);
      console.log(`   Created: ${testRequest.requestedAt}`);
      
      // Verify it appears in librarian API query
      const pendingRequests = await prisma.borrowrequest.findMany({
        where: { status: 'PENDING' },
        include: {
          patron: {
            select: { patronFirstName: true, patronLastName: true }
          },
          item: {
            select: { title: true }
          }
        }
      });
      
      console.log(`\n📋 Current PENDING requests (${pendingRequests.length}):`);
      pendingRequests.forEach((req, i) => {
        const isNewRequest = req.requestId === testRequest.requestId;
        console.log(`   ${i+1}. Request ID: ${req.requestId} ${isNewRequest ? '← NEW TEST REQUEST' : ''}`);
        console.log(`      Patron: ${req.patron.patronFirstName} ${req.patron.patronLastName}`);
        console.log(`      Book: "${req.item.title}"`);
      });
      
      if (pendingRequests.some(req => req.requestId === testRequest.requestId)) {
        console.log('\n✅ SUCCESS: New patron request DOES appear in librarian panel!');
      } else {
        console.log('\n❌ ERROR: New patron request does NOT appear in librarian panel!');
      }
      
    } catch (error) {
      console.error('❌ Error creating test request:', error.message);
      
      if (error.code === 'P2003') {
        console.log('💡 Foreign key constraint error - patron or item doesn\'t exist properly');
      }
    }
    
    // Step 6: Check library settings and constraints
    console.log('\n⚙️ 5. CHECKING SYSTEM CONSTRAINTS:');
    
    const librarySettings = await prisma.librarysettings.findFirst();
    console.log('Library settings:');
    console.log(`   Borrowing limit: ${librarySettings?.borrowingLimit || 'Not set'}`);
    console.log(`   Loan period: ${librarySettings?.loanPeriodDays || 'Not set'} days`);
    
    // Check if any patron has hit their borrowing limit
    for (const patron of allPatrons.slice(-3)) { // Check last 3 patrons
      const activeTransactions = await prisma.transaction.count({
        where: { patronId: patron.patronId, isReturned: false }
      });
      
      const pendingRequestsCount = await prisma.borrowrequest.count({
        where: { 
          patronId: patron.patronId, 
          status: 'PENDING',
          expiresAt: { gt: new Date() }
        }
      });
      
      const totalActive = activeTransactions + pendingRequestsCount;
      console.log(`   Patron ${patron.patronId} (${patron.patronFirstName}): ${totalActive} active items (${activeTransactions} borrowed + ${pendingRequestsCount} pending)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Error in debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugNewPatronRequests();
