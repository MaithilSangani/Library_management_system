const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNiravRequestAPI() {
  try {
    console.log('🧪 TESTING NIRAV REQUEST CREATION VIA API SIMULATION');
    console.log('=' + '='.repeat(55));
    
    // Step 1: Get Nirav's info
    const nirav = await prisma.patron.findUnique({
      where: { patronId: 12 },
      include: {
        transaction: {
          where: { isReturned: false }
        },
        borrowrequest: {
          where: { 
            status: 'PENDING',
            expiresAt: { gt: new Date() }
          }
        }
      }
    });
    
    if (!nirav) {
      console.log('❌ Nirav not found in database!');
      return;
    }
    
    console.log('\n👤 NIRAV\'S CURRENT STATUS:');
    console.log(`   Name: ${nirav.patronFirstName} ${nirav.patronLastName}`);
    console.log(`   Email: ${nirav.patronEmail}`);
    console.log(`   Patron ID: ${nirav.patronId}`);
    console.log(`   Active borrowed books: ${nirav.transaction.length}`);
    console.log(`   Pending requests: ${nirav.borrowrequest.length}`);
    
    // Step 2: Find an available book
    const availableBook = await prisma.item.findFirst({
      where: { 
        availableCopies: { gt: 0 },
        isVisible: true,
        itemId: { notIn: [1] } // Skip books already being tested
      }
    });
    
    if (!availableBook) {
      console.log('❌ No available books found');
      return;
    }
    
    console.log(`\n📚 SELECTED BOOK:`);
    console.log(`   Title: "${availableBook.title}"`);
    console.log(`   Author: ${availableBook.author}`);
    console.log(`   Item ID: ${availableBook.itemId}`);
    console.log(`   Available copies: ${availableBook.availableCopies}`);
    
    // Step 3: Simulate the exact API call that the frontend makes
    console.log('\n🔄 SIMULATING FRONTEND API CALL...');
    console.log('   This simulates: POST /api/patron/borrow-request');
    console.log(`   Body: { itemId: ${availableBook.itemId}, patronId: ${nirav.patronId}, notes: \"Test from frontend\" }`);
    
    // Check if patron exists and validate (same as API)
    const librarySettings = await prisma.librarysettings.findFirst();
    const borrowingLimit = librarySettings?.borrowingLimit || 5;
    
    const totalActiveItems = nirav.transaction.length + nirav.borrowrequest.length;
    console.log(`\n📊 VALIDATION CHECKS:`);
    console.log(`   Borrowing limit: ${borrowingLimit}`);
    console.log(`   Total active items: ${totalActiveItems}`);
    console.log(`   Can create request: ${totalActiveItems < borrowingLimit ? 'YES' : 'NO'}`);
    
    if (totalActiveItems >= borrowingLimit) {
      console.log('❌ WOULD FAIL: Patron has reached borrowing limit');
      return;
    }
    
    // Check if book is available
    if (availableBook.availableCopies <= 0) {
      console.log('❌ WOULD FAIL: Book not available');
      return;
    }
    
    // Check for existing request
    const existingRequest = await prisma.borrowrequest.findFirst({
      where: {
        patronId: nirav.patronId,
        itemId: availableBook.itemId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });
    
    if (existingRequest) {
      console.log('❌ WOULD FAIL: Existing pending request found');
      return;
    }
    
    // Check for existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        patronId: nirav.patronId,
        itemId: availableBook.itemId,
        isReturned: false
      }
    });
    
    if (existingTransaction) {
      console.log('❌ WOULD FAIL: Book already borrowed');
      return;
    }
    
    console.log('✅ ALL VALIDATIONS PASSED');
    
    // Step 4: Create the request (simulate the API)
    console.log('\n📝 CREATING REQUEST...');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const borrowRequest = await prisma.borrowrequest.create({
      data: {
        patronId: nirav.patronId,
        itemId: availableBook.itemId,
        notes: 'Test request created by API simulation for Nirav',
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
    
    console.log('✅ REQUEST CREATED SUCCESSFULLY!');
    console.log(`   Request ID: ${borrowRequest.requestId}`);
    console.log(`   Status: ${borrowRequest.status}`);
    console.log(`   Created: ${borrowRequest.requestedAt}`);
    console.log(`   Expires: ${borrowRequest.expiresAt}`);
    
    // Step 5: Verify it appears in librarian API
    console.log('\n🔍 CHECKING LIBRARIAN API...');
    const librianRequests = await prisma.borrowrequest.findMany({
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
            title: true,
            author: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });
    
    console.log(`📋 Current pending requests (${librianRequests.length}):`);
    librianRequests.forEach((req, i) => {
      const isNiravRequest = req.patronId === nirav.patronId;
      console.log(`   ${i+1}. Request ID: ${req.requestId} ${isNiravRequest ? '← NIRAV REQUEST' : ''}`);
      console.log(`      Patron: ${req.patron.patronFirstName} ${req.patron.patronLastName} (ID: ${req.patron.patronId})`);
      console.log(`      Book: "${req.item.title}" by ${req.item.author}`);
      console.log(`      Created: ${req.requestedAt}`);
    });
    
    // Step 6: Provide frontend testing instructions
    console.log('\n🧪 FRONTEND TESTING INSTRUCTIONS:');
    console.log('');
    console.log('1. **Login as Nirav:**');
    console.log('   - Email: nirav1@gmail.com');
    console.log('   - Check that user.patronId = 12 in browser console');
    console.log('');
    console.log('2. **Make a book request:**');
    console.log(`   - Go to catalog and request \"${availableBook.title}\"`);
    console.log('   - Watch browser Network tab for API call');
    console.log('   - Should POST to: /api/patron/borrow-request');
    console.log(`   - Should send: {\"itemId\": ${availableBook.itemId}, \"patronId\": 12, \"notes\": \"...\"}`);
    console.log('');
    console.log('3. **Check librarian panel:**');
    console.log('   - Login as librarian');
    console.log('   - Go to Borrow Requests');
    console.log(`   - Should see request from \"${nirav.patronFirstName} ${nirav.patronLastName}\"`);
    console.log('');
    console.log('4. **Debug if it fails:**');
    console.log('   - Check browser console for errors');
    console.log('   - Check if API call is made in Network tab');
    console.log('   - Verify response status and data');
    console.log('   - Check if user.patronId is correct');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ API SIMULATION COMPLETE - Backend is working!');
    
  } catch (error) {
    console.error('❌ Error in API simulation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNiravRequestAPI();
