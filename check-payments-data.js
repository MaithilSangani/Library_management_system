const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPaymentsData() {
  try {
    console.log('🔍 Checking payment data in the database...\n');

    // Check total payments count
    const totalPayments = await prisma.payment.count();
    console.log(`📊 Total payments in database: ${totalPayments}`);

    // Check payments by status
    const paymentsByStatus = await prisma.payment.groupBy({
      by: ['paymentStatus'],
      _count: {
        paymentId: true
      },
      _sum: {
        amount: true
      }
    });

    console.log('\n📈 Payments by status:');
    paymentsByStatus.forEach(status => {
      console.log(`  ${status.paymentStatus}: ${status._count.paymentId} payments, Total: $${status._sum.amount || 0}`);
    });

    // Check payments by type
    const paymentsByType = await prisma.payment.groupBy({
      by: ['paymentType'],
      _count: {
        paymentId: true
      },
      _sum: {
        amount: true
      }
    });

    console.log('\n📋 Payments by type:');
    paymentsByType.forEach(type => {
      console.log(`  ${type.paymentType}: ${type._count.paymentId} payments, Total: $${type._sum.amount || 0}`);
    });

    // Get recent payments with patron info
    const recentPayments = await prisma.payment.findMany({
      include: {
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true
          }
        },
        transaction: {
          select: {
            transactionId: true,
            item: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('\n🕒 Recent 10 payments:');
    if (recentPayments.length === 0) {
      console.log('  No payments found in the database.');
    } else {
      recentPayments.forEach((payment, index) => {
        console.log(`  ${index + 1}. Payment #${payment.paymentId}`);
        console.log(`     Patron: ${payment.patron.patronFirstName} ${payment.patron.patronLastName} (${payment.patron.patronEmail})`);
        console.log(`     Amount: $${payment.amount}`);
        console.log(`     Type: ${payment.paymentType}`);
        console.log(`     Status: ${payment.paymentStatus}`);
        console.log(`     Created: ${payment.createdAt}`);
        if (payment.transaction) {
          console.log(`     Related to: ${payment.transaction.item?.title || 'Unknown item'}`);
        }
        console.log('');
      });
    }

    // Check for any schema issues
    console.log('🔍 Checking payment schema fields...');
    const samplePayment = await prisma.payment.findFirst({
      include: {
        patron: true,
        transaction: true
      }
    });

    if (samplePayment) {
      console.log('✅ Payment schema appears correct');
      console.log('   Available fields:', Object.keys(samplePayment));
    } else {
      console.log('⚠️  No payment records found to verify schema');
    }

  } catch (error) {
    console.error('❌ Error checking payments data:', error);
    if (error.code === 'P2021') {
      console.error('   Database table "payment" does not exist');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentsData();
