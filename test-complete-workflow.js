const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteWorkflow() {
  try {
    console.log('🧪 TESTING COMPLETE BORROW REQUEST WORKFLOW');
    console.log('=' + '='.repeat(50));
    
    // Step 1: Create a new borrow request (simulating patron request)
    console.log('\n📋 Step 1: Creating a new borrow request...');
    
    // First, let's find a patron and an available book
    const patron = await prisma.patron.findFirst({
      where: { patronId: 2 } // Deep Vaghamasi
    });
    
    const availableBook = await prisma.item.findFirst({
      where: { 
        availableCopies: { gt: 0 },
        isVisible: true,
        itemId: { not: 1 } // Don't use a book that's already borrowed
      }
    });
    
    console.log(`👤 Using Patron: ${patron.patronFirstName} ${patron.patronLastName} (ID: ${patron.patronId})`);
    console.log(`📚 Using Book: "${availableBook.title}" by ${availableBook.author} (ID: ${availableBook.itemId})`);
    console.log(`📦 Available copies: ${availableBook.availableCopies}`);
    
    // Create expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create the borrow request
    const borrowRequest = await prisma.borrowrequest.create({
      data: {
        patronId: patron.patronId,
        itemId: availableBook.itemId,
        notes: 'Test request created by automated workflow test',
        expiresAt: expiresAt,
      },
      include: {
        item: {
          select: {
            title: true,
            author: true,
            availableCopies: true
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
    
    console.log(`✅ Created borrow request ID: ${borrowRequest.requestId}`);
    console.log(`   Status: ${borrowRequest.status}`);
    console.log(`   Expires: ${borrowRequest.expiresAt}`);
    
    // Step 2: Check if request appears in librarian panel
    console.log('\n🔍 Step 2: Checking if request appears in librarian borrow-requests API...');
    
    const pendingRequests = await prisma.borrowrequest.findMany({
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
            author: true,
            availableCopies: true
          }
        }
      }
    });
    
    console.log(`📋 Found ${pendingRequests.length} PENDING requests:`);
    pendingRequests.forEach((req, i) => {
      console.log(`   ${i+1}. Request ID: ${req.requestId}`);
      console.log(`      Book: "${req.item.title}"`);
      console.log(`      Patron: ${req.patron.patronFirstName} ${req.patron.patronLastName}`);
      console.log(`      Status: ${req.status}`);
    });
    
    // Step 3: Approve the request (simulating librarian approval)
    console.log('\n✅ Step 3: Approving the request (simulating librarian action)...');
    
    // Get library settings
    const librarySettings = await prisma.librarysettings.findFirst();
    const loanPeriodDays = librarySettings?.loanPeriodDays || 14;
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanPeriodDays);
    
    const result = await prisma.$transaction(async (tx) => {
      // Update the borrow request
      const updatedRequest = await tx.borrowrequest.update({
        where: { requestId: borrowRequest.requestId },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: 'test-librarian@library.com'
        }
      });

      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          patronId: borrowRequest.patronId,
          itemId: borrowRequest.itemId,
          dueDate: dueDate,
          isReturned: false
        }
      });

      // Update item availability
      await tx.item.update({
        where: { itemId: borrowRequest.itemId },
        data: { availableCopies: { decrement: 1 } }
      });

      return { updatedRequest, transaction, dueDate };
    });
    
    console.log(`✅ Request approved successfully!`);
    console.log(`   Transaction ID: ${result.transaction.transactionId}`);
    console.log(`   Due Date: ${result.dueDate}`);
    
    // Step 4: Check if the book appears in patron's "My Books"
    console.log('\n📚 Step 4: Checking if book appears in patron\'s books...');
    
    const patronBooks = await prisma.transaction.findMany({
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
      }
    });
    
    console.log(`📖 Patron has ${patronBooks.length} active borrowed books:`);
    patronBooks.forEach((book, i) => {
      console.log(`   ${i+1}. "${book.item.title}" by ${book.item.author}`);
      console.log(`      Transaction ID: ${book.transactionId}`);
      console.log(`      Borrowed: ${book.borrowedAt}`);
      console.log(`      Due: ${book.dueDate}`);
    });
    
    // Step 5: Verify the complete flow worked
    console.log('\n🏁 Step 5: Workflow verification...');
    
    const finalRequest = await prisma.borrowrequest.findUnique({
      where: { requestId: borrowRequest.requestId }
    });
    
    const newTransaction = await prisma.transaction.findUnique({
      where: { transactionId: result.transaction.transactionId }
    });
    
    console.log('✅ WORKFLOW VERIFICATION:');
    console.log(`   Request Status: ${finalRequest.status} (should be APPROVED)`);
    console.log(`   Transaction Created: ${newTransaction ? 'YES' : 'NO'} (should be YES)`);
    console.log(`   Book in Patron's Books: ${patronBooks.some(b => b.transactionId === result.transaction.transactionId) ? 'YES' : 'NO'} (should be YES)`);
    
    if (finalRequest.status === 'APPROVED' && newTransaction && patronBooks.some(b => b.transactionId === result.transaction.transactionId)) {
      console.log('\n🎉 WORKFLOW TEST PASSED! The complete flow is working correctly.');
    } else {
      console.log('\n❌ WORKFLOW TEST FAILED! There is an issue in the flow.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Test completed. Check the results above.');
    
  } catch (error) {
    console.error('❌ Error in workflow test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteWorkflow();
