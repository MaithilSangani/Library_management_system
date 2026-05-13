const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugIssue() {
  try {
    console.log('🔍 Debugging the library management system issue...\n');

    // Check all approved borrow requests
    const approvedRequests = await prisma.borrowrequest.findMany({
      where: { status: 'APPROVED' },
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
            author: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    console.log(`📋 Found ${approvedRequests.length} approved borrow requests:\n`);
    
    approvedRequests.forEach((req, i) => {
      console.log(`${i+1}. Request ID: ${req.requestId}`);
      console.log(`   Book: "${req.item.title}" by ${req.item.author}`);
      console.log(`   Patron: ${req.patron.patronFirstName} ${req.patron.patronLastName} (ID: ${req.patron.patronId})`);
      console.log(`   Processed: ${req.processedAt}`);
      console.log('   ---');
    });

    // Check transactions for patrons who have approved requests
    const patronIds = [...new Set(approvedRequests.map(req => req.patronId))];
    
    console.log(`\n🔍 Checking transactions for ${patronIds.length} patrons with approved requests...\n`);

    for (const patronId of patronIds) {
      const patron = approvedRequests.find(req => req.patronId === patronId).patron;
      
      const transactions = await prisma.transaction.findMany({
        where: { 
          patronId: patronId,
          isReturned: false 
        },
        include: {
          item: {
            select: {
              itemId: true,
              title: true,
              author: true
            }
          }
        },
        orderBy: {
          borrowedAt: 'desc'
        }
      });

      console.log(`📚 Patron: ${patron.patronFirstName} ${patron.patronLastName} (ID: ${patronId})`);
      console.log(`   Active transactions: ${transactions.length}`);
      
      if (transactions.length > 0) {
        transactions.forEach((trans, i) => {
          console.log(`   ${i+1}. "${trans.item.title}" - Transaction ID: ${trans.transactionId}`);
          console.log(`      Borrowed: ${trans.borrowedAt}`);
          console.log(`      Due: ${trans.dueDate}`);
        });
      } else {
        console.log(`   ❌ No active transactions found! This is the issue.`);
        
        // Check if there are transactions that were created but marked as returned
        const allTransactions = await prisma.transaction.findMany({
          where: { patronId: patronId },
          include: {
            item: {
              select: {
                itemId: true,
                title: true,
                author: true
              }
            }
          },
          orderBy: {
            borrowedAt: 'desc'
          }
        });
        
        console.log(`   Total transactions (including returned): ${allTransactions.length}`);
        if (allTransactions.length > 0) {
          allTransactions.forEach((trans, i) => {
            console.log(`   ${i+1}. "${trans.item.title}" - Transaction ID: ${trans.transactionId}`);
            console.log(`      Borrowed: ${trans.borrowedAt}, Returned: ${trans.returnedAt || 'Not returned'}`);
            console.log(`      isReturned: ${trans.isReturned}`);
          });
        }
      }
      
      console.log('   ---\n');
    }

    // Check for any PENDING borrow requests that might not be showing in librarian panel
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
            author: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    console.log(`\n📋 Pending requests (these should show in librarian panel): ${pendingRequests.length}\n`);
    
    if (pendingRequests.length > 0) {
      pendingRequests.forEach((req, i) => {
        console.log(`${i+1}. Request ID: ${req.requestId}`);
        console.log(`   Book: "${req.item.title}" by ${req.item.author}`);
        console.log(`   Patron: ${req.patron.patronFirstName} ${req.patron.patronLastName}`);
        console.log(`   Requested: ${req.requestedAt}`);
        console.log(`   Expires: ${req.expiresAt}`);
        console.log('   ---');
      });
    } else {
      console.log('✅ No pending requests - this explains why librarian panel is empty!');
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugIssue();
