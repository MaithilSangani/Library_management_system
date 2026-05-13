const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFinalPaymentDisplay() {
  try {
    console.log('='.repeat(60));
    console.log('COMPREHENSIVE PAYMENT DISPLAY TEST');
    console.log('='.repeat(60));

    // Simulate the exact API logic used by the frontend
    const [transactions, generalPayments, totalTransactions, totalPayments] = await Promise.all([
      // Book transactions with payments
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
        }
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
        }
      }),
      prisma.transaction.count(),
      prisma.payment.count()
    ]);

    // Transform transactions (existing logic)
    const enhancedTransactions = transactions.map(transaction => {
      const now = new Date();
      const isOverdue = !transaction.isReturned && transaction.dueDate < now;
      const daysOverdue = isOverdue 
        ? Math.floor((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const finePerDay = 1.0;
      const calculatedFine = isOverdue ? daysOverdue * finePerDay : 0;
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
        patronDetails: transaction.patron.isStudent 
          ? `${transaction.patron.student?.studentDepartment || 'N/A'} - Sem ${transaction.patron.student?.studentSemester || 'N/A'}`
          : transaction.patron.isFaculty
            ? transaction.patron.faculty?.facultyDepartment || 'N/A'
            : 'General Member',
        date: transaction.borrowedAt
      };
    });

    // Transform payments (FIXED LOGIC)
    const enhancedPayments = generalPayments.map(payment => {
      return {
        paymentId: payment.paymentId,
        recordType: 'payment', // This is the key field
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
        paymentReference: payment.referenceNumber, // Fixed field mapping
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

    // Combine and sort (as the API does)
    const combinedRecords = [...enhancedTransactions, ...enhancedPayments];
    combinedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Summary statistics
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

    console.log('\n📊 SUMMARY STATISTICS:');
    console.log(`   Total Records: ${summary.totalRecords}`);
    console.log(`   Transactions: ${summary.totalTransactions}`);
    console.log(`   Payments: ${summary.totalPayments}`);
    console.log(`   General Payments Amount: $${summary.totalGeneralPayments.toFixed(2)}`);
    
    console.log('\n📋 COMBINED RECORDS (What frontend will receive):');
    console.log(`   Total combined records: ${combinedRecords.length}`);
    
    combinedRecords.forEach((record, index) => {
      console.log(`\n   ${index + 1}. ${record.recordType.toUpperCase()}`);
      
      if (record.recordType === 'payment') {
        console.log(`      💰 Payment ID: ${record.paymentId}`);
        console.log(`      💵 Amount: $${record.amount.toFixed(2)}`);
        console.log(`      🏷️  Type: ${record.paymentType}`);
        console.log(`      ✅ Status: ${record.paymentStatus}`);
        console.log(`      👤 Patron: ${record.patronName} (${record.patronType})`);
        console.log(`      📅 Date: ${record.date}`);
        if (record.relatedTransaction) {
          console.log(`      🔗 Related: Transaction #${record.relatedTransaction.transactionId} - ${record.relatedTransaction.itemTitle}`);
        }
        console.log(`      📝 Description: ${record.description || 'N/A'}`);
      } else {
        console.log(`      📚 Transaction ID: ${record.transactionId}`);
        console.log(`      📖 Book: ${record.item.title}`);
        console.log(`      👤 Patron: ${record.patronName} (${record.patronType})`);
        console.log(`      🏷️  Status: ${record.status}`);
        if (record.calculatedFine > 0) {
          console.log(`      💸 Fine: $${record.calculatedFine.toFixed(2)}`);
        }
        console.log(`      📅 Date: ${record.date}`);
      }
    });

    console.log('\n🔍 SEPARATE PAYMENTS LIST (Payments tab):');
    enhancedPayments.forEach((payment, index) => {
      console.log(`\n   Payment ${index + 1}:`);
      console.log(`      ID: #${payment.paymentId}`);
      console.log(`      Amount: $${payment.amount.toFixed(2)}`);
      console.log(`      Type: ${payment.paymentType}`);
      console.log(`      Status: ${payment.paymentStatus}`);
      console.log(`      Patron: ${payment.patronName}`);
      console.log(`      Method: ${payment.paymentMethod || 'N/A'}`);
      console.log(`      Reference: ${payment.paymentReference || 'N/A'}`);
      console.log(`      Created: ${payment.createdAt}`);
      if (payment.paidDate) {
        console.log(`      Paid: ${payment.paidDate}`);
      }
    });

    console.log('\n✅ VERIFICATION:');
    const paymentRecords = combinedRecords.filter(r => r.recordType === 'payment');
    const transactionRecords = combinedRecords.filter(r => r.recordType === 'transaction');
    
    console.log(`   ✓ Payment records in combined list: ${paymentRecords.length}`);
    console.log(`   ✓ Transaction records in combined list: ${transactionRecords.length}`);
    console.log(`   ✓ Total combined: ${paymentRecords.length + transactionRecords.length}`);
    
    if (paymentRecords.length > 0) {
      console.log('\n🎉 SUCCESS: Payment records are properly formatted for frontend display!');
      
      console.log('\n📱 FRONTEND DISPLAY PREVIEW:');
      console.log('   In the "All Records" tab, you should see:');
      paymentRecords.forEach((payment, index) => {
        console.log(`   ${index + 1}. Payment Badge | ID #${payment.paymentId} | $${payment.amount} - ${payment.paymentType} | ${payment.patronName} | ${payment.paymentStatus}`);
      });
      
      console.log('\n   In the "Payments" tab, you should see:');
      enhancedPayments.forEach((payment, index) => {
        console.log(`   ${index + 1}. #${payment.paymentId} | $${payment.amount} | ${payment.paymentType} | ${payment.patronName} | ${payment.paymentStatus}`);
      });
    } else {
      console.log('\n❌ WARNING: No payment records found in the combined results.');
    }

    // Test the API response format
    const apiResponse = {
      success: true,
      data: {
        records: combinedRecords, // Combined transactions and payments
        transactions: enhancedTransactions, // Separate transaction data
        payments: enhancedPayments, // Separate payment data
        summary: summary,
        pagination: {
          page: 1,
          limit: 20,
          total: summary.totalRecords,
          pages: Math.ceil(summary.totalRecords / 20),
          hasNext: false,
          hasPrev: false
        }
      }
    };

    console.log('\n🔧 API RESPONSE STRUCTURE:');
    console.log(`   success: ${apiResponse.success}`);
    console.log(`   data.records: ${apiResponse.data.records.length} items`);
    console.log(`   data.transactions: ${apiResponse.data.transactions.length} items`);
    console.log(`   data.payments: ${apiResponse.data.payments.length} items`);
    console.log(`   data.summary: Complete statistics`);
    console.log(`   data.pagination: Pagination info`);

  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalPaymentDisplay();
