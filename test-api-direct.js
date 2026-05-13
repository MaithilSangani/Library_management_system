// Direct test of the transaction history API logic
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTransactionHistoryAPI() {
  try {
    console.log('🧪 Testing Transaction History API Logic...\n');

    // Replicate the exact logic from our API
    const page = 1;
    const limit = 20;
    const search = '';
    const status = '';
    const dateFrom = '';
    const dateTo = '';
    const patronId = '';
    const offset = (page - 1) * limit;

    // Build where clause (same as API)
    const whereClause = {};

    // Get transactions with relations (same as API)
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
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
          finepayment: {
            select: {
              paymentId: true,
              amount: true,
              paidAt: true,
              paymentMethod: true
            }
          }
        },
        orderBy: {
          borrowedAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.transaction.count({
        where: whereClause
      })
    ]);

    console.log(`📊 Found ${total} total transactions`);
    console.log(`📄 Returning ${transactions.length} transactions on this page\n`);

    // Calculate additional info for each transaction (same as API)
    const enhancedTransactions = transactions.map(transaction => {
      const now = new Date();
      const isOverdue = !transaction.isReturned && transaction.dueDate < now;
      const daysOverdue = isOverdue 
        ? Math.floor((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const finePerDay = 1.0;
      const calculatedFine = isOverdue ? daysOverdue * finePerDay : 0;
      const totalFinePaid = transaction.finepayment.reduce((sum, payment) => sum + payment.amount, 0);
      const outstandingFine = Math.max(0, calculatedFine - totalFinePaid);

      return {
        ...transaction,
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
            : 'General Member'
      };
    });

    // Show the processed data
    enhancedTransactions.forEach((transaction, index) => {
      console.log(`${index + 1}. Transaction #${transaction.transactionId}`);
      console.log(`   📖 Book: "${transaction.item.title}" by ${transaction.item.author}`);
      console.log(`   👤 Patron: ${transaction.patronName} (${transaction.patronType})`);
      console.log(`   📅 Borrowed: ${new Date(transaction.borrowedAt).toLocaleDateString()}`);
      console.log(`   📅 Due: ${new Date(transaction.dueDate).toLocaleDateString()}`);
      console.log(`   🔄 Status: ${transaction.status}`);
      console.log(`   💰 Fine: $${transaction.calculatedFine.toFixed(2)} (Outstanding: $${transaction.outstandingFine.toFixed(2)})`);
      console.log(`   ✅ Returned: ${transaction.isReturned ? 'Yes' : 'No'}`);
      if (transaction.isOverdue) {
        console.log(`   ⚠️  Overdue by ${transaction.daysOverdue} days`);
      }
      console.log('');
    });

    // Calculate summary statistics
    const summary = {
      totalTransactions: total,
      activeLoans: enhancedTransactions.filter(t => t.status === 'active').length,
      overdueItems: enhancedTransactions.filter(t => t.status === 'overdue').length,
      returnedBooks: enhancedTransactions.filter(t => t.status === 'returned').length,
      totalFinesCollected: enhancedTransactions.reduce((sum, t) => sum + t.totalFinePaid, 0),
      outstandingFines: enhancedTransactions.reduce((sum, t) => sum + t.outstandingFine, 0)
    };

    console.log('📈 Summary Statistics:');
    console.log(`   📊 Total Transactions: ${summary.totalTransactions}`);
    console.log(`   📚 Active Loans: ${summary.activeLoans}`);
    console.log(`   ⚠️  Overdue Items: ${summary.overdueItems}`);
    console.log(`   ✅ Returned Books: ${summary.returnedBooks}`);
    console.log(`   💰 Total Fines Collected: $${summary.totalFinesCollected.toFixed(2)}`);
    console.log(`   ⏰ Outstanding Fines: $${summary.outstandingFines.toFixed(2)}`);

    console.log('\n✅ API logic test completed successfully!');
    
    return {
      success: true,
      data: {
        transactions: enhancedTransactions,
        summary,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    };

  } catch (error) {
    console.error('❌ API test error:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

testTransactionHistoryAPI();
