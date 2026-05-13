const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBorrowRequests() {
  try {
    console.log('🔍 Checking current borrow requests...');
    
    const requests = await prisma.borrowrequest.findMany({
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

    console.log(`\n📋 Found ${requests.length} borrow requests:\n`);
    
    if (requests.length === 0) {
      console.log('❌ No borrow requests found in the database!');
      console.log('💡 This could be why the librarian panel shows no requests.');
    } else {
      requests.forEach((req, i) => {
        console.log(`${i+1}. Request ID: ${req.requestId}`);
        console.log(`   Book: "${req.item.title}" by ${req.item.author} (ID: ${req.item.itemId})`);
        console.log(`   Available Copies: ${req.item.availableCopies}`);
        console.log(`   Patron: ${req.patron.patronFirstName} ${req.patron.patronLastName} (ID: ${req.patron.patronId})`);
        console.log(`   Email: ${req.patron.patronEmail}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Requested: ${req.requestedAt}`);
        console.log(`   Expires: ${req.expiresAt}`);
        if (req.processedAt) {
          console.log(`   Processed: ${req.processedAt} by ${req.processedBy}`);
        }
        if (req.rejectionReason) {
          console.log(`   Rejection Reason: ${req.rejectionReason}`);
        }
        console.log('   ---\n');
      });

      // Check specifically for PENDING requests
      const pendingRequests = requests.filter(req => req.status === 'PENDING');
      console.log(`📊 Status breakdown:`);
      console.log(`   - PENDING: ${pendingRequests.length}`);
      console.log(`   - APPROVED: ${requests.filter(req => req.status === 'APPROVED').length}`);
      console.log(`   - REJECTED: ${requests.filter(req => req.status === 'REJECTED').length}`);
      console.log(`   - EXPIRED: ${requests.filter(req => req.status === 'EXPIRED').length}`);
    }

  } catch (error) {
    console.error('❌ Error checking borrow requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBorrowRequests();
