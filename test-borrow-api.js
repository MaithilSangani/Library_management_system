// Test the actual borrow request API endpoints
async function testBorrowRequestAPI() {
  console.log('🔧 Testing Borrow Request API Endpoints...\n');

  const ports = [3000, 3001, 3002]; // Common Next.js ports
  
  // First, find which port the server is running on
  let serverPort = null;
  for (const port of ports) {
    try {
      console.log(`🔍 Checking port ${port}...`);
      const response = await fetch(`http://localhost:${port}`, { timeout: 2000 });
      if (response.status) {
        console.log(`✅ Server found on port ${port}`);
        serverPort = port;
        break;
      }
    } catch (error) {
      console.log(`❌ Port ${port} not responding`);
    }
  }

  if (!serverPort) {
    console.log('\n❌ No server found running');
    console.log('💡 Please start the development server first:');
    console.log('   1. Open a new terminal');
    console.log('   2. Run: npm run dev');
    console.log('   3. Wait for the server to start');
    console.log('   4. Run this test again');
    return;
  }

  const baseURL = `http://localhost:${serverPort}`;

  try {
    // Test 1: Direct API call to librarian borrow requests
    console.log('\n1. Testing GET /api/librarian/borrow-requests...');
    const librarianResponse = await fetch(`${baseURL}/api/librarian/borrow-requests?status=PENDING&page=1&limit=10`);
    console.log(`   Status: ${librarianResponse.status} ${librarianResponse.statusText}`);
    
    if (librarianResponse.ok) {
      const librarianData = await librarianResponse.json();
      console.log('   ✅ Librarian API endpoint reachable');
      console.log(`   📊 Total requests: ${librarianData.pagination?.total || 'undefined'}`);
      console.log(`   📄 Requests returned: ${librarianData.requests?.length || 0}`);
      
      if (librarianData.requests && librarianData.requests.length > 0) {
        console.log('   📋 Sample request:');
        const sample = librarianData.requests[0];
        console.log(`      - ID: ${sample.requestId}`);
        console.log(`      - Patron: ${sample.patron?.patronFirstName} ${sample.patron?.patronLastName}`);
        console.log(`      - Item: "${sample.item?.title}"`);
        console.log(`      - Status: ${sample.status}`);
        console.log(`      - Requested: ${sample.requestedAt}`);
      } else {
        console.log('   ❌ No requests returned from API');
        console.log('   🔍 But our database test found pending requests...');
        console.log('   💡 This suggests an issue with the API logic or query');
      }
    } else {
      const errorText = await librarianResponse.text();
      console.log(`   ❌ API failed: ${errorText}`);
    }

    // Test 2: Test patron API to see their requests
    console.log('\n2. Testing GET /api/patron/borrow-request...');
    const patronResponse = await fetch(`${baseURL}/api/patron/borrow-request?patronId=2`);
    console.log(`   Status: ${patronResponse.status} ${patronResponse.statusText}`);
    
    if (patronResponse.ok) {
      const patronData = await patronResponse.json();
      console.log('   ✅ Patron API endpoint reachable');
      console.log(`   📄 Patron requests: ${patronData.length || 0}`);
      
      if (patronData.length > 0) {
        patronData.forEach((req, index) => {
          console.log(`      ${index + 1}. "${req.item.title}" - ${req.status} (Requested: ${req.requestedAt})`);
        });
      }
    } else {
      console.log('   ❌ Patron API failed');
    }

    // Test 3: Try to create a new borrow request via API
    console.log('\n3. Testing POST /api/patron/borrow-request...');
    const createResponse = await fetch(`${baseURL}/api/patron/borrow-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemId: 2, // 1984 book
        patronId: 3, // Arjun Bala
        notes: 'Test API request creation'
      })
    });

    console.log(`   Status: ${createResponse.status} ${createResponse.statusText}`);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('   ✅ Request creation successful');
      console.log(`   📋 New request ID: ${createData.requestId}`);
      console.log(`   📅 Expires at: ${createData.expiresAt}`);
      
      // Now check if it appears in librarian API
      console.log('\n4. Verifying new request appears in librarian API...');
      const verifyResponse = await fetch(`${baseURL}/api/librarian/borrow-requests?status=PENDING&page=1&limit=10`);
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log(`   📊 Total pending requests now: ${verifyData.pagination?.total || 'undefined'}`);
        console.log(`   📄 Requests in response: ${verifyData.requests?.length || 0}`);
        
        const newRequest = verifyData.requests?.find(r => r.requestId === createData.requestId);
        if (newRequest) {
          console.log('   ✅ New request found in librarian API!');
          console.log('   🎉 The API chain is working correctly');
        } else {
          console.log('   ❌ New request NOT found in librarian API');
          console.log('   🔍 There might be a delay or caching issue');
        }
      }
    } else {
      const errorText = await createResponse.text();
      console.log(`   ❌ Request creation failed: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test (using a simple fetch implementation for Node.js)
global.fetch = global.fetch || (async (url, options = {}) => {
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch(url, { timeout: 5000, ...options });
});

testBorrowRequestAPI();
