const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPaymentData() {
  try {
    console.log('Checking payment data...\n');
    
    // Get all payments
    const payments = await prisma.payment.findMany({
      include: {
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true,
            patronEmail: true,
            isStudent: true,
            isFaculty: true
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
      }
    });

    console.log(`Found ${payments.length} payment records:`);
    
    if (payments.length > 0) {
      payments.forEach((payment, index) => {
        console.log(`\n--- Payment ${index + 1} ---`);
        console.log(`ID: ${payment.paymentId}`);
        console.log(`Amount: $${payment.amount}`);
        console.log(`Type: ${payment.paymentType}`);
        console.log(`Status: ${payment.paymentStatus}`);
        console.log(`Description: ${payment.description || 'None'}`);
        console.log(`Patron: ${payment.patron.patronFirstName} ${payment.patron.patronLastName}`);
        console.log(`Created: ${payment.createdAt}`);
        console.log(`Paid: ${payment.paidDate || 'Not paid'}`);
        
        if (payment.transaction) {
          console.log(`Related Transaction: #${payment.transaction.transactionId}`);
          console.log(`Book: ${payment.transaction.item?.title}`);
        }
      });
    } else {
      console.log('No payment records found in database.');
    }

    // Also check transactions with payments
    console.log('\n' + '='.repeat(50));
    console.log('Checking transactions with payment records...');
    
    const transactionsWithPayments = await prisma.transaction.findMany({
      include: {
        payment: true,
        patron: {
          select: {
            patronFirstName: true,
            patronLastName: true
          }
        },
        item: {
          select: {
            title: true,
            author: true
          }
        }
      },
      where: {
        payment: {
          some: {}
        }
      }
    });

    console.log(`Found ${transactionsWithPayments.length} transactions with payments:`);
    
    transactionsWithPayments.forEach((transaction, index) => {
      console.log(`\n--- Transaction ${index + 1} ---`);
      console.log(`ID: ${transaction.transactionId}`);
      console.log(`Book: ${transaction.item.title} by ${transaction.item.author}`);
      console.log(`Patron: ${transaction.patron.patronFirstName} ${transaction.patron.patronLastName}`);
      console.log(`Payments (${transaction.payment.length}):`);
      
      transaction.payment.forEach((payment, pIndex) => {
        console.log(`  ${pIndex + 1}. $${payment.amount} - ${payment.paymentType} (${payment.paymentStatus})`);
      });
    });

  } catch (error) {
    console.error('Error checking payment data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentData();
