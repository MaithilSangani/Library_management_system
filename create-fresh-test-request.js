const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFreshTestRequest() {
  try {
    console.log('🧪 Creating a fresh test request for librarian panel testing...');
    
    // Find a patron and available book
    const patron = await prisma.patron.findFirst({
      where: { patronId: 11 } // Darshan Halani
    });
    
    const availableBook = await prisma.item.findFirst({
      where: { 
        availableCopies: { gt: 0 },
        isVisible: true,
        itemId: { notIn: [1, 2, 3, 113, 116] } // Skip already borrowed books
      }
    });
    
    if (!patron) {
      console.error('❌ No patron found!');
      return;
    }
    
    if (!availableBook) {
      console.error('❌ No available book found!');
      return;
    }
    
    console.log(`👤 Patron: ${patron.patronFirstName} ${patron.patronLastName} (ID: ${patron.patronId})`);
    console.log(`📚 Book: "${availableBook.title}" by ${availableBook.author} (ID: ${availableBook.itemId})`);
    console.log(`📦 Available copies: ${availableBook.availableCopies}`);
    
    // Create expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create the borrow request (without notifications to avoid foreign key issues)
    const result = await prisma.borrowrequest.create({
      data: {
        patronId: patron.patronId,
        itemId: availableBook.itemId,
        notes: 'Test request for UI testing - please approve or reject this request',
        expiresAt: expiresAt,
      },
      include: {
        item: {
          select: {
            title: true,
            author: true,
            isbn: true
          }
        },
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true
          }
        }
      }
    });
    
    console.log(`✅ Created borrow request successfully!`);
    console.log(`   Request ID: ${result.requestId}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Requested: ${result.requestedAt}`);
    console.log(`   Expires: ${result.expiresAt}`);
    
    // Verify it appears in pending requests
    const pendingCount = await prisma.borrowrequest.count({
      where: { status: 'PENDING' }
    });
    
    console.log(`\n📋 Total pending requests now: ${pendingCount}`);
    console.log('✅ This request should now appear in the librarian panel!');
    
    console.log('\n📝 Next steps:');
    console.log('1. Start your Next.js dev server: npm run dev');
    console.log('2. Login as a librarian');
    console.log('3. Go to Borrow Requests page');
    console.log(`4. You should see the request for "${availableBook.title}"}`);
    console.log('5. Approve it and check if it appears in patron\'s My Books');
    
  } catch (error) {
    console.error('❌ Error creating test request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFreshTestRequest();
