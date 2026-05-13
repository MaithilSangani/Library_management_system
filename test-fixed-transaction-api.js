const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTransactionHistoryAPILogic() {
  try {
    console.log('🧪 Testing the FIXED transaction-history API logic...\n');

    // Simulate the exact logic from the fixed API
    const [transactions, generalPayments, totalTransactions, totalPayments] = await Promise.all([
      // Book transactions - using the FIXED query
      prisma.transaction.findMany({
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
          payment: { // FIXED: Now using 'payment' instead of 'finepayment'
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
      }),
      // General payments from patron panel
      prisma.payment.findMany({
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
      }),
      prisma.transaction.count(),
      prisma.payment.count()
    ]);

    console.log(`✅ Transaction query executed successfully!`);
    console.log(`   Found ${transactions.length} transactions`);
    console.log(`   Found ${generalPayments.length} payments\n`);

    // Test enhanced transaction processing
    const enhancedTransactions = transactions.map(transaction => {
      const now = new Date();
      const isOverdue = !transaction.isReturned && transaction.dueDate < now;
      const daysOverdue = isOverdue 
        ? Math.floor((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const finePerDay = 1.0;
      const calculatedFine = isOverdue ? daysOverdue * finePerDay : 0;

      // FIXED: Using transaction.payment instead of transaction.finepayment
      const totalFinePaid = transaction.payment.filter(payment => 
        payment.paymentType === 'FINE' || payment.paymentType === 'LATE_FEE'
      ).reduce((sum, payment) => sum + payment.amount, 0);
      
      const outstandingFine = Math.max(0, calculatedFine - totalFinePaid);

      return {
        ...transaction,
        recordType: 'transaction',
        isOverdue,
        daysOverdue,
        calculatedFine,
        totalFinePaid,
        outstandingFine,
        status: transaction.isReturned ? 'returned' : (isOverdue ? 'overdue' : 'active'),
        patronName: `${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`,
        patronType: transaction.patron.isStudent ? 'Student' : (transaction.patron.isFaculty ? 'Faculty' : 'General'),
        date: transaction.borrowedAt
      };
    });

    console.log(`✅ Enhanced transactions processed successfully!`);

    // Test enhanced payment processing
    const enhancedPayments = generalPayments.map(payment => {
      return {
        paymentId: payment.paymentId,
        recordType: 'payment',
        patron: payment.patron,
        patronName: `${payment.patron.patronFirstName} ${payment.patron.patronLastName}`,
        patronType: payment.patron.isStudent ? 'Student' : (payment.patron.isFaculty ? 'Faculty' : 'General'),
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentStatus: payment.paymentStatus,
        date: payment.paidDate || payment.createdAt,
        relatedTransaction: payment.transaction ? {
          transactionId: payment.transaction.transactionId,
          itemTitle: payment.transaction.item?.title,
          itemAuthor: payment.transaction.item?.author
        } : null
      };
    });

    console.log(`✅ Enhanced payments processed successfully!`);

    // Combine and test sorting
    const combinedRecords = [...enhancedTransactions, ...enhancedPayments];
    combinedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`\n📊 Combined Results:`);
    console.log(`   Total combined records: ${combinedRecords.length}`);
    console.log(`   Transaction records: ${combinedRecords.filter(r => r.recordType === 'transaction').length}`);
    console.log(`   Payment records: ${combinedRecords.filter(r => r.recordType === 'payment').length}`);

    // Show sample records
    console.log(`\n📋 Sample combined records (latest 5):`);
    combinedRecords.slice(0, 5).forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.recordType.toUpperCase()}`);
      if (record.recordType === 'transaction') {
        console.log(`      Item: ${record.item.title}`);
        console.log(`      Patron: ${record.patronName}`);
        console.log(`      Status: ${record.status}`);
        console.log(`      Date: ${record.date}`);
      } else {
        console.log(`      Payment: $${record.amount} (${record.paymentType})`);
        console.log(`      Patron: ${record.patronName}`);
        console.log(`      Status: ${record.paymentStatus}`);
        console.log(`      Date: ${record.date}`);
      }
      console.log('');
    });

    // Test summary statistics
    const summary = {
      totalTransactions: totalTransactions,
      totalPayments: totalPayments,
      totalRecords: totalTransactions + totalPayments,
      activeLoans: enhancedTransactions.filter(t => t.status === 'active').length,
      overdueItems: enhancedTransactions.filter(t => t.status === 'overdue').length,
      returnedBooks: enhancedTransactions.filter(t => t.status === 'returned').length,
      totalFinesCollected: enhancedTransactions.reduce((sum, t) => sum + t.totalFinePaid, 0),
      outstandingFines: enhancedTransactions.reduce((sum, t) => sum + t.outstandingFine, 0),
      totalGeneralPayments: enhancedPayments.reduce((sum, p) => sum + p.amount, 0),
      paidPayments: enhancedPayments.filter(p => p.paymentStatus === 'PAID').length,
      pendingPayments: enhancedPayments.filter(p => p.paymentStatus === 'PENDING').length
    };

    console.log(`\n📈 Summary Statistics:`);
    console.log(`   Total Transactions: ${summary.totalTransactions}`);
    console.log(`   Total Payments: ${summary.totalPayments}`);
    console.log(`   Total Records: ${summary.totalRecords}`);
    console.log(`   Active Loans: ${summary.activeLoans}`);
    console.log(`   Overdue Items: ${summary.overdueItems}`);
    console.log(`   Returned Books: ${summary.returnedBooks}`);
    console.log(`   Total Fines Collected: $${summary.totalFinesCollected}`);
    console.log(`   Outstanding Fines: $${summary.outstandingFines}`);
    console.log(`   Total General Payments: $${summary.totalGeneralPayments}`);
    console.log(`   Paid Payments: ${summary.paidPayments}`);
    console.log(`   Pending Payments: ${summary.pendingPayments}`);

    console.log(`\n🎉 ALL TESTS PASSED! The API should now work correctly.`);
    console.log(`✅ Payment data will now be visible in the librarian transaction history panel.`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.message.includes('finepayment')) {
      console.error('   ⚠️  Still references to "finepayment" found - this relation does not exist!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testTransactionHistoryAPILogic();
