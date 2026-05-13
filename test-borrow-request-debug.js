const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBorrowRequestSystem() {
  try {
    console.log('🔍 Testing Borrow Request System...\n');

    // 1. Check if we have any patrons
    console.log('1. Checking for patrons...');
    const patrons = await prisma.patron.findMany({
      take: 3,
      select: {
        patronId: true,
        patronFirstName: true,
        patronLastName: true,
        patronEmail: true
      }
    });
    console.log(`Found ${patrons.length} patrons:`);
    patrons.forEach(p => console.log(`  - ${p.patronFirstName} ${p.patronLastName} (ID: ${p.patronId}, Email: ${p.patronEmail})`));

    // 2. Check if we have any items
    console.log('\n2. Checking for available items...');
    const items = await prisma.item.findMany({
      where: {
        isVisible: true,
        availableCopies: { gt: 0 }
      },
      take: 3,
      select: {
        itemId: true,
        title: true,
        author: true,
        availableCopies: true,
        totalCopies: true
      }
    });
    console.log(`Found ${items.length} available items:`);
    items.forEach(i => console.log(`  - "${i.title}" by ${i.author} (ID: ${i.itemId}, Available: ${i.availableCopies}/${i.totalCopies})`));

    // 3. Check for existing borrow requests
    console.log('\n3. Checking existing borrow requests...');
    const requests = await prisma.borrowrequest.findMany({
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true } },
        item: { select: { title: true } }
      },
      orderBy: { requestedAt: 'desc' },
      take: 5
    });
    console.log(`Found ${requests.length} borrow requests:`);
    requests.forEach(r => console.log(`  - ${r.patron.patronFirstName} ${r.patron.patronLastName} requested "${r.item.title}" (Status: ${r.status}, Requested: ${r.requestedAt})`));

    // 4. If we have patrons and items but no requests, create a test request
    if (patrons.length > 0 && items.length > 0) {
      console.log('\n4. Creating a test borrow request...');
      
      const testPatron = patrons[0];
      const testItem = items[0];
      
      // Check if this patron already has a request for this item
      const existingRequest = await prisma.borrowrequest.findFirst({
        where: {
          patronId: testPatron.patronId,
          itemId: testItem.itemId,
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        console.log(`  ⚠️  Test patron already has a pending request for this item (Request ID: ${existingRequest.requestId})`);
      } else {
        try {
          // Create expiration date (7 days from now)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          // Create the borrow request and notification in a transaction
          const result = await prisma.$transaction(async (tx) => {
            // Create the borrow request
            const borrowRequest = await tx.borrowrequest.create({
              data: {
                patronId: testPatron.patronId,
                itemId: testItem.itemId,
                notes: `Test request created by debug script for "${testItem.title}"`,
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

            // Create notification for patron (confirmation)
            await tx.notification.create({
              data: {
                recipientId: testPatron.patronId,
                recipientType: 'PATRON',
                type: 'BORROW_REQUEST',
                title: 'Test Borrow Request Submitted',
                message: `Your test request to borrow "${testItem.title}" has been submitted and is pending librarian approval.`,
                relatedId: borrowRequest.requestId,
                relatedType: 'BORROW_REQUEST'
              }
            });

            return borrowRequest;
          });

          console.log(`  ✅ Successfully created test borrow request!`);
          console.log(`     - Request ID: ${result.requestId}`);
          console.log(`     - Patron: ${result.patron.patronFirstName} ${result.patron.patronLastName}`);
          console.log(`     - Item: "${result.item.title}" by ${result.item.author}`);
          console.log(`     - Status: ${result.status}`);
          console.log(`     - Expires: ${result.expiresAt}`);

        } catch (error) {
          console.error('  ❌ Error creating test borrow request:', error.message);
          if (error.code === 'P2002') {
            console.log('     This might be a duplicate request constraint error.');
          }
        }
      }
    } else {
      console.log('\n4. ⚠️  Cannot create test request - missing patrons or items');
    }

    // 5. Final check - show all pending requests
    console.log('\n5. Final check - all pending borrow requests:');
    const pendingRequests = await prisma.borrowrequest.findMany({
      where: { status: 'PENDING' },
      include: {
        patron: { select: { patronFirstName: true, patronLastName: true, patronEmail: true } },
        item: { select: { title: true, author: true } }
      },
      orderBy: { requestedAt: 'desc' }
    });

    if (pendingRequests.length === 0) {
      console.log('  ❌ No pending borrow requests found!');
      console.log('     This might be why the librarian panel shows no requests.');
    } else {
      console.log(`  ✅ Found ${pendingRequests.length} pending requests:`);
      pendingRequests.forEach((req, index) => {
        console.log(`     ${index + 1}. ${req.patron.patronFirstName} ${req.patron.patronLastName} -> "${req.item.title}"`);
        console.log(`        Email: ${req.patron.patronEmail}`);
        console.log(`        Requested: ${req.requestedAt}`);
        console.log(`        Expires: ${req.expiresAt}`);
        console.log(`        Request ID: ${req.requestId}\n`);
      });
    }

    // 6. Test the API endpoint directly
    console.log('\n6. Testing API endpoints...');
    
    // Simulate API call to get borrow requests
    try {
      console.log('  Testing GET /api/librarian/borrow-requests...');
      const whereClause = { status: 'PENDING' };
      
      const [apiRequests, total] = await Promise.all([
        prisma.borrowrequest.findMany({
          where: whereClause,
          include: {
            patron: {
              select: {
                patronId: true,
                patronFirstName: true,
                patronLastName: true,
                patronEmail: true,
                isStudent: true,
                isFaculty: true
              }
            },
            item: {
              select: {
                itemId: true,
                title: true,
                author: true,
                isbn: true,
                imageUrl: true,
                availableCopies: true,
                totalCopies: true
              }
            }
          },
          orderBy: {
            requestedAt: 'desc'
          },
          skip: 0,
          take: 20
        }),
        prisma.borrowrequest.count({
          where: whereClause
        })
      ]);

      console.log(`  ✅ API simulation successful!`);
      console.log(`     - Returned ${apiRequests.length} requests`);
      console.log(`     - Total count: ${total}`);
      
      if (apiRequests.length === 0) {
        console.log('  ❌ API would return empty results - this explains the issue!');
      }

    } catch (apiError) {
      console.error('  ❌ API simulation failed:', apiError.message);
    }

    console.log('\n🔍 Debug Summary:');
    console.log('================');
    console.log(`- Patrons in database: ${patrons.length}`);
    console.log(`- Available items: ${items.length}`);
    console.log(`- Total borrow requests: ${requests.length}`);
    console.log(`- Pending requests: ${pendingRequests.length}`);
    
    if (pendingRequests.length === 0) {
      console.log('\n💡 LIKELY ISSUE: No pending borrow requests exist in the database.');
      console.log('   This is why the librarian panel shows no requests.');
      console.log('   Try creating a borrow request from the patron interface first.');
    } else {
      console.log('\n✅ Pending requests exist - the issue might be elsewhere.');
      console.log('   Check the librarian panel authentication or API calls.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testBorrowRequestSystem();
