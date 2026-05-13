const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeAllPayments() {
  try {
    console.log('🔄 Starting payment removal process...');
    
    // Get current count of payments
    const paymentCount = await prisma.payment.count();
    const finePaymentCount = await prisma.finepayment.count();
    
    console.log(`📊 Current records:`);
    console.log(`  - General payments: ${paymentCount}`);
    console.log(`  - Fine payments: ${finePaymentCount}`);
    console.log(`  - Total payment records: ${paymentCount + finePaymentCount}`);
    
    if (paymentCount === 0 && finePaymentCount === 0) {
      console.log('✅ No payment records found. Database is already clean.');
      return;
    }
    
    // Remove all fine payments first (due to foreign key constraints)
    if (finePaymentCount > 0) {
      console.log('🗑️ Removing fine payments...');
      const deletedFinePayments = await prisma.finepayment.deleteMany({});
      console.log(`✅ Removed ${deletedFinePayments.count} fine payment records`);
    }
    
    // Remove all general payments
    if (paymentCount > 0) {
      console.log('🗑️ Removing general payments...');
      const deletedPayments = await prisma.payment.deleteMany({});
      console.log(`✅ Removed ${deletedPayments.count} general payment records`);
    }
    
    // Verify deletion
    const remainingPayments = await prisma.payment.count();
    const remainingFinePayments = await prisma.finepayment.count();
    
    console.log('\n📊 Final status:');
    console.log(`  - General payments remaining: ${remainingPayments}`);
    console.log(`  - Fine payments remaining: ${remainingFinePayments}`);
    
    if (remainingPayments === 0 && remainingFinePayments === 0) {
      console.log('🎉 All payment records have been successfully removed!');
    } else {
      console.log('⚠️ Some payment records may still exist. Please check manually.');
    }
    
  } catch (error) {
    console.error('❌ Error removing payment records:', error);
    console.error('This might be due to foreign key constraints or database connection issues.');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the payment removal
removeAllPayments();
