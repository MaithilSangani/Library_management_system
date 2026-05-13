const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTransactionHistoryAPI() {
  try {
    console.log('Testing transaction history API logic...\n');
    
    // Simulate the same query that the API uses
    const [transactions, generalPayments, totalTransactions, totalPayments] = await Promise.all([
      // Book transactions
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

    console.log(`Transactions found: ${transactions.length}`);
    console.log(`General payments found: ${generalPayments.length}`);
    console.log(`Total transactions: ${totalTransactions}`);
    console.log(`Total payments: ${totalPayments}`);
    
    console.log('\n--- Transaction Details ---');
    transactions.forEach((transaction, index) => {
      console.log(`Transaction ${index + 1}:`);
      console.log(`  ID: ${transaction.transactionId}`);
      console.log(`  Book: ${transaction.item.title}`);
      console.log(`  Patron: ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`);
      console.log(`  Payments attached: ${transaction.payment.length}`);
      if (transaction.payment.length > 0) {
        transaction.payment.forEach((payment, pIndex) => {
          console.log(`    Payment ${pIndex + 1}: $${payment.amount} - ${payment.paymentType} (${payment.paymentStatus})`);
        });
      }
    });

    console.log('\n--- General Payment Details ---');
    generalPayments.forEach((payment, index) => {
      console.log(`Payment ${index + 1}:`);
      console.log(`  ID: ${payment.paymentId}`);
      console.log(`  Amount: $${payment.amount}`);
      console.log(`  Type: ${payment.paymentType}`);
      console.log(`  Status: ${payment.paymentStatus}`);
      console.log(`  Patron: ${payment.patron.patronFirstName} ${payment.patron.patronLastName}`);
      console.log(`  Related Transaction: ${payment.transaction ? payment.transaction.transactionId : 'None'}`);
      if (payment.transaction) {
        console.log(`  Book: ${payment.transaction.item?.title}`);
      }
    });

    // Transform payments like the API does
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
        paymentReference: payment.referenceNumber,
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

    console.log('\n--- Enhanced Payments (API format) ---');
    console.log(`Number of enhanced payments: ${enhancedPayments.length}`);
    enhancedPayments.forEach((payment, index) => {
      console.log(`Enhanced Payment ${index + 1}:`);
      console.log(`  Record Type: ${payment.recordType}`);
      console.log(`  ID: ${payment.paymentId}`);
      console.log(`  Amount: $${payment.amount}`);
      console.log(`  Type: ${payment.paymentType}`);
      console.log(`  Status: ${payment.paymentStatus}`);
      console.log(`  Patron: ${payment.patronName} (${payment.patronType})`);
      console.log(`  Date: ${payment.date}`);
      if (payment.relatedTransaction) {
        console.log(`  Related Transaction: #${payment.relatedTransaction.transactionId} - ${payment.relatedTransaction.itemTitle}`);
      }
    });

  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTransactionHistoryAPI();
