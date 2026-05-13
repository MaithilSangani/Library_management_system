const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTransactionHistoryAPI() {
  try {
    console.log('🔍 Testing transaction-history API logic...\n');

    // Test the same query that the API uses for general payments
    const generalPayments = await prisma.payment.findMany({
      include: {
        patron: {
          select: {
            patronId: true,
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true,
            isStudent: true,
            isFaculty: true,
            student: {
              select: {
                studentDepartment: true,
                studentSemester: true,
                studentRollNo: true,
                studentEnrollmentNumber: true
              }
            },
            faculty: {
              select: {
                facultyDepartment: true
              }
            }
          }
        },
        transaction: {
          select: {
            transactionId: true,
            item: {
              select: {
                title: true,
                author: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log(`📊 Found ${generalPayments.length} payments for transaction history`);
    
    if (generalPayments.length > 0) {
      console.log('\n💰 Payment details:');
      generalPayments.forEach((payment, index) => {
        console.log(`  ${index + 1}. Payment #${payment.paymentId}`);
        console.log(`     Patron: ${payment.patron.patronFirstName} ${payment.patron.patronLastName}`);
        console.log(`     Amount: $${payment.amount}`);
        console.log(`     Type: ${payment.paymentType}`);
        console.log(`     Status: ${payment.paymentStatus}`);
        console.log(`     Created: ${payment.createdAt}`);
        
        if (payment.transaction) {
          console.log(`     Related to transaction ${payment.transaction.transactionId}: ${payment.transaction.item?.title}`);
        } else {
          console.log(`     General payment (no transaction link)`);
        }
        console.log('');
      });

      // Transform payments like the API does
      console.log('🔄 Transforming payments like the API...');
      const enhancedPayments = generalPayments.map(payment => {
        return {
          paymentId: payment.paymentId,
          recordType: 'payment',
          patron: payment.patron,
          patronName: `${payment.patron.patronFirstName} ${payment.patron.patronLastName}`,
          patronType: payment.patron.isStudent ? 'Student' : (payment.patron.isFaculty ? 'Faculty' : 'General'),
          patronDetails: payment.patron.isStudent 
            ? `${payment.patron.student?.studentDepartment || 'N/A'} - Sem ${payment.patron.student?.studentSemester || 'N/A'}`
            : payment.patron.isFaculty
              ? payment.patron.faculty?.facultyDepartment || 'N/A'
              : 'General Member',
          amount: payment.amount,
          paymentType: payment.paymentType,
          paymentStatus: payment.paymentStatus,
          description: payment.description,
          paymentMethod: payment.paymentMethod,
          paymentReference: payment.paymentReference,
          date: payment.paidDate || payment.createdAt,
          createdAt: payment.createdAt,
          paidDate: payment.paidDate,
          relatedTransaction: payment.transaction ? {
            transactionId: payment.transaction.transactionId,
            itemTitle: payment.transaction.item?.title,
            itemAuthor: payment.transaction.item?.author
          } : null
        };
      });

      console.log(`✅ Successfully transformed ${enhancedPayments.length} payments`);
      console.log('\n📋 Sample transformed payment:');
      console.log(JSON.stringify(enhancedPayments[0], null, 2));
    }

    // Also check transactions
    const transactions = await prisma.transaction.findMany({
      include: {
        patron: {
          select: {
            patronId: true,
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true,
            isStudent: true,
            isFaculty: true,
            student: {
              select: {
                studentDepartment: true,
                studentSemester: true,
                studentRollNo: true,
                studentEnrollmentNumber: true
              }
            },
            faculty: {
              select: {
                facultyDepartment: true
              }
            }
          }
        },
        item: {
          select: {
            itemId: true,
            title: true,
            author: true,
            isbn: true,
            imageUrl: true,
            subject: true,
            itemType: true,
            condition: true
          }
        },
        payment: {
          select: {
            paymentId: true,
            amount: true,
            paymentType: true,
            paymentStatus: true,
            description: true,
            paymentMethod: true,
            referenceNumber: true,
            createdAt: true,
            paidDate: true
          }
        }
      },
      orderBy: {
        borrowedAt: 'desc'
      },
      take: 20
    });

    console.log(`\n📚 Found ${transactions.length} transactions`);

    // Combine and sort
    const combinedRecords = [];
    
    // Add enhanced payments
    generalPayments.forEach(payment => {
      combinedRecords.push({
        ...payment,
        recordType: 'payment',
        date: payment.paidDate || payment.createdAt
      });
    });

    // Add transactions 
    transactions.forEach(transaction => {
      combinedRecords.push({
        ...transaction,
        recordType: 'transaction',
        date: transaction.borrowedAt
      });
    });

    // Sort by date
    combinedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`\n🔄 Combined records: ${combinedRecords.length} total`);
    console.log(`   - Payments: ${combinedRecords.filter(r => r.recordType === 'payment').length}`);
    console.log(`   - Transactions: ${combinedRecords.filter(r => r.recordType === 'transaction').length}`);

    const totalPayments = await prisma.payment.count();
    const totalTransactions = await prisma.transaction.count();

    console.log(`\n📊 Database totals:`);
    console.log(`   - Total payments in DB: ${totalPayments}`);
    console.log(`   - Total transactions in DB: ${totalTransactions}`);
    console.log(`   - Total combined records: ${totalPayments + totalTransactions}`);

  } catch (error) {
    console.error('❌ Error testing transaction history API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTransactionHistoryAPI();
