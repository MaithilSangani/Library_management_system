const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLibrarianActions() {
  try {
    console.log('🔍 Testing Librarian Approve/Reject functionality...\n');
    
    // 1. First, check current pending requests
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
            availableCopies: true,
            totalCopies: true
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });
    
    console.log(`📝 Current pending borrow requests (${pendingRequests.length}):`);
    if (pendingRequests.length === 0) {
      console.log('   No pending requests found');
      
      // Create a test request for testing
      console.log('\n🧪 Creating a test borrow request...');
      const testPatron = await prisma.patron.findFirst();
      const testItem = await prisma.item.findFirst({
        where: { availableCopies: { gt: 0 } }
      });
      
      if (testPatron && testItem) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await prisma.borrowrequest.create({
          data: {
            patronId: testPatron.patronId,
            itemId: testItem.itemId,
            notes: 'Test request for librarian actions',
            expiresAt: expiresAt
          }
        });
        
        console.log(`   ✅ Created test request: ${testPatron.patronFirstName} wants "${testItem.title}"`);
        
        // Refresh the pending requests
        const newPendingRequests = await prisma.borrowrequest.findMany({
          where: { status: 'PENDING' },
          include: {
            patron: {
              select: {
                patronId: true,
                patronFirstName: true,
                patronLastName: true
              }
            },
            item: {
              select: {
                title: true,
                author: true,
                availableCopies: true
              }
            }
          }
        });
        
        console.log(`\n📝 Updated pending requests (${newPendingRequests.length}):`);
        newPendingRequests.forEach(request => {
          console.log(`  - ID ${request.requestId}: ${request.patron.patronFirstName} ${request.patron.patronLastName} wants "${request.item.title}"`);
          console.log(`    Available copies: ${request.item.availableCopies}`);
        });
      }
    } else {
      pendingRequests.forEach(request => {
        console.log(`  - ID ${request.requestId}: ${request.patron.patronFirstName} ${request.patron.patronLastName} wants "${request.item.title}"`);
        console.log(`    Requested: ${request.requestedAt.toLocaleString()}`);
        console.log(`    Available copies: ${request.item.availableCopies}/${request.item.totalCopies}`);
      });
    }
    
    // 2. Check existing transactions and notifications
    const transactions = await prisma.transaction.findMany({
      where: { isReturned: false },
      include: {
        patron: {
          select: { patronFirstName: true, patronLastName: true }
        },
        item: {
          select: { title: true }
        }
      }
    });
    
    console.log(`\n📚 Current active transactions (${transactions.length}):`);
    if (transactions.length === 0) {
      console.log('   No active transactions');
    } else {
      transactions.forEach(transaction => {
        console.log(`  - ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName} borrowed "${transaction.item.title}"`);
        console.log(`    Due: ${transaction.dueDate.toLocaleDateString()}`);
      });
    }
    
    // 3. Check notifications
    const recentNotifications = await prisma.notification.findMany({
      where: {
        OR: [
          { type: 'BORROW_APPROVED' },
          { type: 'BORROW_REJECTED' },
          { type: 'BORROW_REQUEST' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n🔔 Recent notifications (${recentNotifications.length}):`);
    if (recentNotifications.length === 0) {
      console.log('   No notifications found');
    } else {
      recentNotifications.forEach(notif => {
        console.log(`  - ${notif.type}: ${notif.title}`);
        console.log(`    To: ${notif.recipientType} (ID: ${notif.recipientId})`);
        console.log(`    Status: ${notif.status}, Created: ${notif.createdAt.toLocaleString()}`);
        console.log(`    Message: ${notif.message}`);
        console.log('    ---');
      });
    }
    
    // 4. Check librarians
    const librarians = await prisma.librarian.findMany();
    console.log(`\n👩‍💼 Available librarians (${librarians.length}):`);
    librarians.forEach(librarian => {
      console.log(`  - ${librarian.librarianFirstName} ${librarian.librarianLastName} (${librarian.librarianEmail})`);
    });
    
    // 5. Test simulate approve action (if we have pending requests)
    const testPendingRequest = await prisma.borrowrequest.findFirst({
      where: { status: 'PENDING' },
      include: {
        patron: true,
        item: true
      }
    });
    
    if (testPendingRequest) {
      console.log(`\n🧪 Testing APPROVE simulation for Request ID ${testPendingRequest.requestId}:`);
      console.log(`   Patron: ${testPendingRequest.patron.patronFirstName} ${testPendingRequest.patron.patronLastName}`);
      console.log(`   Item: "${testPendingRequest.item.title}" by ${testPendingRequest.item.author}`);
      console.log(`   Available copies before: ${testPendingRequest.item.availableCopies}`);
      
      // Simulate what would happen on approval (without actually doing it)
      console.log('   ✅ Would create transaction record');
      console.log('   ✅ Would decrement available copies');
      console.log('   ✅ Would send approval notification to patron');
      console.log('   ✅ Would update request status to APPROVED');
      console.log('   ✅ Would add book to patron\'s "My Books"');
      
      console.log(`\n🧪 Testing REJECT simulation for Request ID ${testPendingRequest.requestId}:`);
      console.log('   ❌ Would update request status to REJECTED');
      console.log('   ❌ Would add rejection reason');
      console.log('   ❌ Would send rejection notification to patron');
      console.log('   ❌ Would NOT create transaction');
      console.log('   ❌ Would NOT change available copies');
    }
    
    console.log('\n✅ Librarian functionality analysis complete!');
    console.log('\n📋 Summary of what should work:');
    console.log('   1. Librarian sees pending requests in /librarian/borrow-requests');
    console.log('   2. APPROVE button: Creates transaction, adds to My Books, sends notification');
    console.log('   3. REJECT button: Updates status, sends rejection notification');
    console.log('   4. All actions are stored in database');
    console.log('   5. Notifications appear in both librarian and patron panels');
    
  } catch (error) {
    console.error('❌ Error testing librarian actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLibrarianActions();
