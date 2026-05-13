const http = require('http');

// Test the patron books API for patron ID 2 (Deep Vaghamasi) who has 2 active books
async function testPatronBooksAPI() {
  console.log('🧪 Testing patron books API...');
  console.log('Testing for Patron ID 2 (Deep Vaghamasi) who should have 2 books');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/patron/books?patronId=2',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📡 Response Status: ${res.statusCode}`);
        console.log(`📡 Response Headers:`, res.headers);
        
        try {
          const result = JSON.parse(data);
          console.log('\n✅ API Response (parsed):');
          console.log('Current loans:', result.currentLoans?.length || 0);
          console.log('History:', result.history?.length || 0);
          console.log('Stats:', result.stats);
          
          if (result.currentLoans && result.currentLoans.length > 0) {
            console.log('\n📚 Current loans details:');
            result.currentLoans.forEach((book, index) => {
              console.log(`  ${index + 1}. "${book.item.title}" by ${book.item.author}`);
              console.log(`     Status: ${book.status}, Due: ${book.dueDate}`);
              console.log(`     Transaction ID: ${book.transactionId}`);
            });
          }
          
          resolve(result);
        } catch (error) {
          console.log('\n❌ Raw response (JSON parse failed):');
          console.log(data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Also test for patron ID 11 (Darshan Halani) who should have 2 books
async function testPatronBooksAPI2() {
  console.log('\n\n🧪 Testing patron books API for Patron ID 11...');
  console.log('Testing for Patron ID 11 (Darshan Halani) who should have 2 books');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/patron/books?patronId=11',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📡 Response Status: ${res.statusCode}`);
        
        try {
          const result = JSON.parse(data);
          console.log('\n✅ API Response (parsed):');
          console.log('Current loans:', result.currentLoans?.length || 0);
          console.log('Stats:', result.stats);
          
          if (result.currentLoans && result.currentLoans.length > 0) {
            console.log('\n📚 Current loans details:');
            result.currentLoans.forEach((book, index) => {
              console.log(`  ${index + 1}. "${book.item.title}" by ${book.item.author}`);
              console.log(`     Status: ${book.status}, Due: ${book.dueDate}`);
              console.log(`     Transaction ID: ${book.transactionId}`);
            });
          }
          
          resolve(result);
        } catch (error) {
          console.log('\n❌ Raw response (JSON parse failed):');
          console.log(data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  try {
    console.log('📝 Note: Make sure the Next.js dev server is running on localhost:3000');
    console.log('Run "npm run dev" if it\'s not running');
    console.log('\n' + '='.repeat(60));
    
    await testPatronBooksAPI();
    await testPatronBooksAPI2();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the Next.js development server is running:');
      console.error('   Run: npm run dev');
    }
  }
}

runTests();
