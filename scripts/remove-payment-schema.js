const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removePaymentData() {
  try {
    console.log('🧹 Starting payment data cleanup...');

    // Remove all general payments
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✅ Removed ${deletedPayments.count} general payment records`);

    // Remove all fine payments
    const deletedFinePayments = await prisma.finepayment.deleteMany({});
    console.log(`✅ Removed ${deletedFinePayments.count} fine payment records`);

    console.log('🎉 Payment data cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  removePaymentData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { removePaymentData };
