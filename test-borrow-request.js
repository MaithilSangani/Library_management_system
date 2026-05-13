const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBorrowRequest() {
  try {
    console.log('🔍 Testing Borrow Request functionality...\n');
    
    // 1. Check if we have patrons in the database
    const patrons = await prisma.patron.findMany({
      select: {
        patronId: true,
        patronFirstName: true,
        patronLastName: true,
        patronEmail: true
      }
    });
    
    console.log(`📚 Found ${patrons.length} patrons in database:`);
    patrons.forEach(patron => {
      console.log(`  - ${patron.patronFirstName} ${patron.patronLastName} (ID: ${patron.patronId})`);
    });
    
    if (patrons.length === 0) {
      console.log('❌ No patrons found! You need to create patron accounts first.');
      return;
    }
    
    // 2. Check if we have available items
    const items = await prisma.item.findMany({
      where: {
        isVisible: true,
        availableCopies: { gt: 0 }
      },
      select: {
        itemId: true,
        title: true,
        author: true,
        availableCopies: true,
        totalCopies: true
      },
      take: 5
    });
    
    console.log(`\n📖 Found ${items.length} available items:`);
    items.forEach(item => {
      console.log(`  - "${item.title}" by ${item.author} (${item.availableCopies}/${item.totalCopies} available)`);
    });
    
    if (items.length === 0) {
      console.log('❌ No available items found!');
      return;
    }
    
    // 3. Check if we have librarians
    const librarians = await prisma.librarian.findMany({
      select: {
        librarianId: true,
        librarianFirstName: true,
        librarianLastName: true,
        librarianEmail: true
      }
    });
    
    console.log(`\n👩‍💼 Found ${librarians.length} librarians:`);
    librarians.forEach(librarian => {
      console.log(`  - ${librarian.librarianFirstName} ${librarian.librarianLastName} (ID: ${librarian.librarianId})`);
    });
    
    // 4. Test creating a borrow request
    const testPatron = patrons[0];
    const testItem = items[0];
    
    console.log(`\n🧪 Testing borrow request creation:`);
    console.log(`  Patron: ${testPatron.patronFirstName} ${testPatron.patronLastName}`);
    console.log(`  Item: "${testItem.title}" by ${testItem.author}`);
    
    // Check if there's already a pending request for this combination
    const existingRequest = await prisma.borrowrequest.findFirst({
      where: {
        patronId: testPatron.patronId,
        itemId: testItem.itemId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });
    
    if (existingRequest) {
      console.log('⚠️ There is already a pending request for this item by this patron');
      console.log(`   Request ID: ${existingRequest.requestId}`);
    } else {
      console.log('✅ No existing pending request - ready to create new one');
    }
    
    // 5. Check current borrow requests
    const borrowRequests = await prisma.borrowrequest.findMany({
      where: { status: 'PENDING' },
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
            author: true
          }
        }
      },
      orderBy: { requestedAt: 'desc' },
      take: 5
    });
    
    console.log(`\n📝 Current pending borrow requests (${borrowRequests.length}):`);
    if (borrowRequests.length === 0) {
      console.log('   No pending requests');
    } else {
      borrowRequests.forEach(request => {
        console.log(`  - ${request.patron.patronFirstName} ${request.patron.patronLastName} wants "${request.item.title}"`);
        console.log(`    Requested: ${request.requestedAt.toLocaleString()}`);
        console.log(`    Expires: ${request.expiresAt.toLocaleString()}`);
      });
    }
    
    // 6. Check notifications
    const notifications = await prisma.notification.findMany({
      where: { 
        recipientType: 'LIBRARIAN',
        type: 'BORROW_REQUEST'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n🔔 Recent librarian notifications (${notifications.length}):`);
    if (notifications.length === 0) {
      console.log('   No notifications found');
    } else {
      notifications.forEach(notif => {
        console.log(`  - ${notif.title}: ${notif.message}`);
        console.log(`    Status: ${notif.status}, Created: ${notif.createdAt.toLocaleString()}`);
      });
    }
    
    console.log('\n✅ Borrow request system analysis complete!');
    
  } catch (error) {
    console.error('❌ Error testing borrow request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testBorrowRequest();
