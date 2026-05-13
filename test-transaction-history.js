// Test script for transaction history API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testTransactionHistoryAPI() {
  console.log('🧪 Testing Transaction History API...\n');

  try {
    // Test 1: Get all transactions (first page)
    console.log('📊 Test 1: Fetching transaction history (first page)...');
    const response1 = await fetch(`${API_BASE}/api/librarian/transaction-history?page=1&limit=10`);
    const data1 = await response1.json();
    
    if (data1.success) {
      console.log('✅ Successfully fetched transaction history');
      console.log(`   - Total transactions: ${data1.data.summary.totalTransactions}`);
      console.log(`   - Active loans: ${data1.data.summary.activeLoans}`);
      console.log(`   - Overdue items: ${data1.data.summary.overdueItems}`);
      console.log(`   - Returned books: ${data1.data.summary.returnedBooks}`);
      console.log(`   - Found ${data1.data.transactions.length} transactions on this page`);
    } else {
      console.log('❌ Failed to fetch transaction history:', data1.error);
    }

    // Test 2: Search transactions
    console.log('\n🔍 Test 2: Searching transactions with search term...');
    const response2 = await fetch(`${API_BASE}/api/librarian/transaction-history?search=book&limit=5`);
    const data2 = await response2.json();
    
    if (data2.success) {
      console.log('✅ Search functionality working');
      console.log(`   - Found ${data2.data.transactions.length} transactions matching search`);
    } else {
      console.log('❌ Search failed:', data2.error);
    }

    // Test 3: Filter by status
    console.log('\n📋 Test 3: Filtering by status (active)...');
    const response3 = await fetch(`${API_BASE}/api/librarian/transaction-history?status=active&limit=5`);
    const data3 = await response3.json();
    
    if (data3.success) {
      console.log('✅ Status filter working');
      console.log(`   - Found ${data3.data.transactions.length} active transactions`);
    } else {
      console.log('❌ Status filter failed:', data3.error);
    }

    // Test 4: Get transaction details (if we have any transactions)
    if (data1.success && data1.data.transactions.length > 0) {
      console.log('\n🔍 Test 4: Fetching detailed transaction information...');
      const firstTransaction = data1.data.transactions[0];
      
      const response4 = await fetch(`${API_BASE}/api/librarian/transaction-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: firstTransaction.transactionId })
      });
      
      const data4 = await response4.json();
      
      if (data4.success) {
        console.log('✅ Transaction details fetch working');
        console.log(`   - Transaction ID: ${data4.data.transactionId}`);
        console.log(`   - Book: ${data4.data.item.title}`);
        console.log(`   - Patron: ${data4.data.patronName}`);
        console.log(`   - Status: ${data4.data.status}`);
      } else {
        console.log('❌ Failed to fetch transaction details:', data4.error);
      }
    }

    console.log('\n🎉 Transaction History API tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - The development server is running (npm run dev)');
    console.log('   - The database is properly connected');
    console.log('   - You have some transaction data in your database');
  }
}

// Run the test
testTransactionHistoryAPI();
