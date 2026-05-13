const fetch = require('node-fetch'); 

async function testTransactionHistoryEndpoint() {
  try {
    console.log('Testing transaction history API endpoint...\n');
    
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3001/api/librarian/transaction-history?page=1&limit=20', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log(`Success: ${data.success}`);
    console.log(`Total Records: ${data.data?.summary?.totalRecords || 0}`);
    console.log(`Total Transactions: ${data.data?.summary?.totalTransactions || 0}`);
    console.log(`Total Payments: ${data.data?.summary?.totalPayments || 0}`);
    
    console.log('\n--- Combined Records ---');
    if (data.data?.records) {
      data.data.records.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Type: ${record.recordType}`);
        console.log(`  ID: ${record.recordType === 'transaction' ? record.transactionId : record.paymentId}`);
        console.log(`  Patron: ${record.patronName} (${record.patronType})`);
        
        if (record.recordType === 'payment') {
          console.log(`  Amount: $${record.amount}`);
          console.log(`  Payment Type: ${record.paymentType}`);
          console.log(`  Status: ${record.paymentStatus}`);
          if (record.relatedTransaction) {
            console.log(`  Related to: Transaction #${record.relatedTransaction.transactionId}`);
          }
        } else {
          console.log(`  Book: ${record.item?.title}`);
          console.log(`  Status: ${record.status}`);
          if (record.calculatedFine > 0) {
            console.log(`  Fine: $${record.calculatedFine}`);
          }
        }
        console.log(`  Date: ${record.date}`);
        console.log('');
      });
    }

    console.log('\n--- Separate Payments ---');
    if (data.data?.payments) {
      data.data.payments.forEach((payment, index) => {
        console.log(`Payment ${index + 1}:`);
        console.log(`  ID: ${payment.paymentId}`);
        console.log(`  Amount: $${payment.amount}`);
        console.log(`  Type: ${payment.paymentType}`);
        console.log(`  Status: ${payment.paymentStatus}`);
        console.log(`  Patron: ${payment.patronName}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error testing endpoint:', error.message);
    
    // Check if the server is running
    if (error.code === 'ECONNREFUSED') {
      console.log('\nIt seems the development server is not running.');
      console.log('Please start the server with: npm run dev');
      console.log('Then run this test again.');
    }
  }
}

testTransactionHistoryEndpoint();
