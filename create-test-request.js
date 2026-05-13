const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestRequest() {
  try {
    console.log('🧪 Creating test borrow request...\n');

    // Find a patron and a book they haven't requested yet
    const testPatron = await prisma.patron.findFirst({
      where: { patronId: 2 }, // Deep Vaghamasi
      include: {
        borrowrequest: {
          select: { itemId: true }
        }
      }
    });

    if (!testPatron) {
      console.log('❌ Test patron not found');
      return;
    }

    // Get list of books this patron has NOT requested
    const requestedItemIds = testPatron.borrowrequest.map(req => req.itemId);
    
    const availableBook = await prisma.item.findFirst({
      where: {
        availableCopies: { gt: 0 },
        isVisible: true,
        itemId: { 
          notIn: requestedItemIds 
        }
      }
    });

    if (!availableBook) {
      console.log('❌ No available books that patron hasn\'t already requested');
      
      // Let's try with a different patron
      console.log('\n🔄 Trying with a different patron...');
      const altPatron = await prisma.patron.findFirst({
        where: { 
          patronId: { not: 2 }
        }
      });
      
      if (altPatron) {
        const altBook = await prisma.item.findFirst({
          where: {
            availableCopies: { gt: 0 },
            isVisible: true
          }
        });
        
        if (altBook) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          const testRequest = await prisma.borrowrequest.create({
            data: {
              patronId: altPatron.patronId,
              itemId: altBook.itemId,
              notes: 'TEST REQUEST - Created by diagnostic script to verify librarian panel workflow',
              expiresAt: expiresAt
            }
          });

          console.log('✅ Test request created successfully!');
          console.log(`   Request ID: ${testRequest.requestId}`);
          console.log(`   Patron: ${altPatron.patronFirstName} ${altPatron.patronLastName} (ID: ${altPatron.patronId})`);
          console.log(`   Book: "${altBook.title}" by ${altBook.author}`);
          console.log(`   Status: ${testRequest.status}`);
          return;
        }
      }
      
      console.log('❌ Could not create test request with any patron/book combination');
      return;
    }

    console.log(`👤 Patron: ${testPatron.patronFirstName} ${testPatron.patronLastName} (ID: ${testPatron.patronId})`);
    console.log(`📚 Book: "${availableBook.title}" by ${availableBook.author}`);
    console.log(`📦 Available copies: ${availableBook.availableCopies}`);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const testRequest = await prisma.borrowrequest.create({
      data: {
        patronId: testPatron.patronId,
        itemId: availableBook.itemId,
        notes: 'TEST REQUEST - Created by diagnostic script to verify librarian panel workflow',
        expiresAt: expiresAt
      }
    });

    console.log('\n✅ Test request created successfully!');
    console.log(`   Request ID: ${testRequest.requestId}`);
    console.log(`   Status: ${testRequest.status}`);
    console.log(`   Expires: ${testRequest.expiresAt}`);

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Go to the librarian panel');
    console.log('3. You should now see 1 pending request');
    console.log('4. Approve the request to test the complete workflow');

  } catch (error) {
    console.error('❌ Error creating test request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRequest();
